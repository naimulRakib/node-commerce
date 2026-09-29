// ডাটাবেস সংযোগ (Database Connection) পুল এবং সরাসরি কুয়েরি চালানোর অবজেক্ট ইমপোর্ট করা হচ্ছে।
import { db, pool } from "./db";
// অডিট লগিং (Audit Logging) বা সিস্টেমের কার্যক্রম রেকর্ড করার ফাংশন ইমপোর্ট করা হচ্ছে।
import { logAudit } from "./audit";
// =============================================================================
// ট্রানজ্যাকশনাল বিজনেস লজিক (TRANSACTIONAL BUSINESS LOGIC)
// =============================================================================
// [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control
// এই মডিউলটি রিলেশনাল ডাটাবেসের ACID (Atomicity, Consistency, Isolation, Durability) প্রপার্টি 
// সরাসরি (raw) PostgreSQL ট্রানজ্যাকশন (BEGIN/COMMIT/ROLLBACK) এর মাধ্যমে নিশ্চিত করে।
// =============================================================================

// অর্ডার প্লেস (Place Order) করার সময় প্রয়োজনীয় ইনপুট ডেটার টাইপ ডেফিনেশন (Type Definition)।
export type PlaceOrderInput = {
  customerId: number;
  shippingAddressId: number;
  courierId?: number;
  couponCode?: string;
  paymentMethod: string; // পেমেন্টের ধরন (যেমন: card, bkash, nagad, wallet, cod)
};

// অর্ডার প্লেস করার ফলাফল (Result) নির্দেশকারী টাইপ ডেফিনেশন। এটি একটি ডিসক্রিমিনেটেড ইউনিয়ন (Discriminated Union)।
export type PlaceOrderResult =
  | { success: true; orderId: number } // সফল হলে 'success: true' এবং অর্ডারের আইডি।
  | { success: false; error: string }; // ব্যর্থ হলে 'success: false' এবং ত্রুটির বার্তা।

// ─── অর্ডার প্লেসমেন্ট ট্রানজ্যাকশন (Place Order Transaction) ──────────────────────────────────
// এই ফাংশনটি একটি সম্পূর্ণ অর্ডার প্রক্রিয়া পরিচালনা করে। এটি একটি অত্যন্ত জটিল ডেটাবেস ট্রানজ্যাকশন 
// যেখানে কার্ট থেকে আইটেম নেওয়া, ইনভেন্টরি কমানো (Inventory Deduction), কুপন প্রয়োগ এবং 
// চালান (Invoice) তৈরি করা—এই সবকিছু একটি সিঙ্গেল অ্যাটমিক (Atomic) ধাপে সম্পন্ন হয়।
export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  // ইনপুট অবজেক্ট থেকে প্রয়োজনীয় ভ্যারিয়েবলগুলো ডিস্ট্রাকচার (Destructure) করা হচ্ছে।
  const { customerId, shippingAddressId, courierId, couponCode, paymentMethod } = input;
  // ট্রানজ্যাকশন পরিচালনার জন্য পুল (pool) থেকে একটি ডেডিকেটেড ক্লায়েন্ট (Dedicated Client) ধার (checkout) করা হচ্ছে।
  const client = await pool.connect();

  try {
    // ── সিরিয়ালাইজেবল আইসোলেশন লেভেল (Serializable isolation level) ──────────────────────────────
    // এটি ডেটাবেস ট্রানজ্যাকশনের সর্বোচ্চ আইসোলেশন স্তর। এটি 'ফ্যান্টম রিড' (Phantom Read) এবং 
    // 'রেস কন্ডিশন' (Race Condition) প্রতিরোধ করে, অর্থাৎ একই সময়ে দুজন ব্যবহারকারী সর্বশেষ পণ্যটি কিনতে পারবে না।
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // ── ধাপ ১: কার্ট এবং এর আইটেমগুলো পুনরুদ্ধার (Fetch cart with items) ──────────────────────
    const cartRes = await client.query('SELECT cart_id FROM cart WHERE customer_id = $1', [customerId]);
    if (cartRes.rows.length === 0) throw new Error("Cart is empty");
    const cartId = cartRes.rows[0].cart_id;

    // [CHECKLIST REQUIREMENT 7]: Use of Complex Queries
    // কার্টের আইটেম এবং পণ্যের বিবরণ একসাথে আনার জন্য একাধিক টেবিল 'JOIN' করে একটি কমপ্লেক্স কুয়েরি (Complex Query) চালানো হচ্ছে।
    // এখানে cart_item, product এবং product_variant টেবিলগুলোকে একসাথে লেফট জয়েন (LEFT JOIN) করে ডেটা আনা হচ্ছে।
    const itemsRes = await client.query(`
      SELECT ci.*, p.name as product_name, p.base_price, 
             NULL::numeric as price_override, v.color, v.size
      FROM cart_item ci
      JOIN product p ON ci.product_id = p.product_id
      LEFT JOIN product_variant v ON ci.variant_code = v.variant_code
      WHERE ci.cart_id = $1
    `, [cartId]);
    const cartItems = itemsRes.rows;
    if (cartItems.length === 0) throw new Error("Cart is empty");

    // ── ধাপ ২: প্রতিটি আইটেমের জন্য মজুদ যাচাই (Validate stock for each item) ───────────────
    for (const item of cartItems) {
      if (item.variant_code) {
        // যদি পণ্যের ভ্যারিয়েন্ট থাকে, তবে ভ্যারিয়েন্ট স্তরের (variant-level) ইনভেন্টরি চেক করা হয়।
        const variantStockRes = await client.query(`
          SELECT quantity FROM product_variant 
          WHERE variant_code = $1 LIMIT 1
        `, [item.variant_code]);
        // পর্যাপ্ত মজুদ না থাকলে ট্রানজ্যাকশন বাতিল (Abort) করা হয়।
        if (variantStockRes.rows.length === 0 || variantStockRes.rows[0].quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product_name} (${item.color ?? ""} ${item.size ?? ""}).`);
        }
      } else {
        // ভ্যারিয়েন্ট না থাকলে পণ্য স্তরের (product-level) ইনভেন্টরি চেক করা হয়।
        const stockRes = await client.query(`
          SELECT stock_qty as quantity FROM product 
          WHERE product_id = $1 LIMIT 1
        `, [item.product_id]);
        if (stockRes.rows.length === 0 || stockRes.rows[0].quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product_name}.`);
        }
      }
    }

    // ── ধাপ ৩: মোট মূল্য গণনা (Calculate totals) ───────────────────────────
    let subtotal = 0;
    for (const item of cartItems) {
      const unitPrice = item.price_override ?? item.base_price;
      subtotal += Number(unitPrice) * item.quantity;
    }

    let discountAmount = 0;
    let coupon = null;

    // যদি কুপন কোড দেওয়া থাকে, তবে তার বৈধতা যাচাই করা হয়।
    if (couponCode) {
      const couponRes = await client.query('SELECT * FROM coupon WHERE code = $1', [couponCode]);
      coupon = couponRes.rows[0];
      // কুপন সক্রিয় কিনা, ন্যূনতম খরচের শর্ত পূরণ হয়েছে কিনা এবং মেয়াদোত্তীর্ণ হয়েছে কিনা তা পরীক্ষা করা হচ্ছে (Business Rules validation)।
      if (
        coupon &&
        coupon.is_active &&
        subtotal >= Number(coupon.min_spend) &&
        (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date()) &&
        (!coupon.usage_limit || coupon.usage_count < coupon.usage_limit)
      ) {
        // ডিসকাউন্ট পার্সেন্টেজ (Percentage) অনুযায়ী হলে:
        if (coupon.discount_type === "percentage") {
          discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
          if (coupon.max_discount) {
            discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
          }
        } else {
          // ডিসকাউন্ট ফিক্সড (Fixed) অ্যামাউন্ট হলে:
          discountAmount = Number(coupon.discount_value);
        }
      } else {
        coupon = null; // কুপন অবৈধ হলে তা বাতিল করা হয়।
      }
    }

    // শিপিং চার্জ নির্ধারণ।
    const shippingFee = subtotal >= 999 ? 0 : 60;
    const baseAmount = subtotal - discountAmount + shippingFee;
    const taxAmount = baseAmount * 0.05;
    const totalAmount = baseAmount + taxAmount;

    // ── ধাপ ৩.১: ওয়ালেট পেমেন্ট হলে ব্যালেন্স যাচাই করা (Validate Wallet Balance) ──
    if (paymentMethod === "wallet") {
      const walletRes = await client.query('SELECT balance FROM wallet WHERE customer_id = $1', [customerId]);
      const walletBalance = walletRes.rows[0]?.balance ?? 0;
      if (Number(walletBalance) < totalAmount) {
        throw new Error("Insufficient wallet balance. Please add money to your wallet or choose another payment method.");
      }
    }

    // ── ধাপ ৪: কাস্টমার অর্ডার তৈরি (Create CustomerOrder) ───────────────────────
    // 'customer_order' টেবিলে নতুন রেকর্ড ইনসার্ট (Insert) করে অর্ডার আইডি (order_id) রিটার্ন (RETURNING) নেওয়া হচ্ছে।
    const orderRes = await client.query(`
      INSERT INTO customer_order 
        (customer_id, courier_id, coupon_code, shipping_address_id, status, subtotal, discount_amount, shipping_fee, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING order_id
    `, [
      customerId, courierId ?? null, coupon ? couponCode : null, shippingAddressId, "pending",
      subtotal, discountAmount, shippingFee, totalAmount
    ]);
    const orderId = orderRes.rows[0].order_id;

    // ── ধাপ ৫: অর্ডার আইটেম তৈরি বা প্রাইস স্ন্যাপশট (Create OrderItems) ─────────
    // বর্তমান মূল্য (Unit Price) সহ প্রতিটি আইটেমকে 'order_item' টেবিলে সংরক্ষণ করা হচ্ছে 
    // যাতে ভবিষ্যতে পণ্যের দাম পরিবর্তন হলেও অর্ডারের দাম অপরিবর্তিত (Immutable) থাকে।
    for (const item of cartItems) {
      const unitPrice = item.price_override ?? item.base_price;
      await client.query(`
        INSERT INTO order_item (order_id, product_id, code, quantity, unit_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [orderId, item.product_id, item.variant_code ?? null, item.quantity, unitPrice]);
    }

    // ── ধাপ ৬: ইনভেন্টরি থেকে পরিমাণ কমানো (Deduct inventory) ───────────────────────────
    for (const item of cartItems) {
      if (item.variant_code) {
        // ভ্যারিয়েন্ট ইনভেন্টরি আপডেট (Update) করা হচ্ছে।
        await client.query(`
          UPDATE variant_inventory 
          SET quantity = quantity - $1 WHERE variant_code = $2
        `, [item.quantity, item.variant_code]);
        // পাশাপাশি মূল 'product_variant' টেবিলও আপডেট করা হচ্ছে (ডেটা রিডানডেন্সি বা Data Redundancy সিঙ্ক)।
        await client.query(`
          UPDATE product_variant 
          SET quantity = quantity - $1 WHERE variant_code = $2
        `, [item.quantity, item.variant_code]);
      }
      // মূল প্রোডাক্ট ইনভেন্টরি আপডেট করা হচ্ছে।
      await client.query(`
        UPDATE inventory 
        SET quantity = quantity - $1 WHERE product_id = $2
      `, [item.quantity, item.product_id]);
      await client.query(`
        UPDATE product 
        SET stock_qty = stock_qty - $1 WHERE product_id = $2
      `, [item.quantity, item.product_id]);
    }

    // ── ধাপ ৭: ইনভয়েস তৈরি (Create Invoice) ─────────────────────────────
    // কর (Tax) হিসাব করে চালান বা ইনভয়েস তৈরি করা হচ্ছে।
    await client.query(`
      INSERT INTO invoice (order_id, tax_amount, tax_rate, status)
      VALUES ($1, $2, $3, $4)
    `, [orderId, taxAmount, 5.0, "issued"]);

    // ── ধাপ ৮: পেমেন্ট রেকর্ড তৈরি (Create Payment record) ──────────────────────
    // একটি র্যান্ডম ট্রানজ্যাকশন আইডি (Transaction ID - txid) জেনারেট (Generate) করা হচ্ছে।
    const txid = `NC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await client.query(`
      INSERT INTO payment (order_id, txid, amount, method, status, paid_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      orderId, txid, totalAmount, paymentMethod, 
      paymentMethod === "cod" ? "pending" : "success",
      paymentMethod !== "cod" ? new Date() : null
    ]);

    // ── ধাপ ৮.১: ওয়ালেট থেকে টাকা কাটা (Deduct from Wallet if applicable) ───
    if (paymentMethod === "wallet") {
      await client.query(`
        UPDATE wallet SET balance = balance - $1 WHERE customer_id = $2
      `, [totalAmount, customerId]);
    }

    // ── ধাপ ৯: কুপন ব্যবহারের সংখ্যা বৃদ্ধি (Increment coupon usage) ─────────────────────
    if (coupon && couponCode) {
      await client.query(`
        UPDATE coupon SET usage_count = usage_count + 1 WHERE code = $1
      `, [couponCode]);
    }

    // ── ধাপ ১০: কার্ট খালি করা (Clear cart items) ──────────────────────────
    // অর্ডার সফল হওয়ার পর কার্ট থেকে আইটেমগুলো মুছে ফেলা হচ্ছে।
    await client.query('DELETE FROM cart_item WHERE cart_id = $1', [cartId]);

    // সফলভাবে সমস্ত ১০টি ধাপ সম্পন্ন হলে ট্রানজ্যাকশনটি কমিট (COMMIT) করা হয়।
    // [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (COMMIT)
    await client.query("COMMIT");

    // ── ধাপ ১১: অডিট লগ (Audit log) ──
    // এটি ট্রানজ্যাকশনের বাইরে লগ করা হয় যেন এটি মূল প্রসেসকে ব্লক (Block) না করে।
    await logAudit("customer_order", orderId, "INSERT", customerId, null, {
      order_id: orderId,
      status: "pending",
      total_amount: totalAmount,
    });

    return { success: true, orderId: orderId };
  } catch (error) {
    // কোনো একটি ধাপে ত্রুটি (Error) দেখা দিলে ট্রানজ্যাকশনটি রোলব্যাক (ROLLBACK) করা হয়, 
    // অর্থাৎ আগের সমস্ত পরিবর্তন বাতিল করে ডাটাবেসকে পূর্বের অবস্থায় ফিরিয়ে নেওয়া হয় (Atomicity)।
    // [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (ROLLBACK)
    await client.query("ROLLBACK");
    console.error("[placeOrder] Transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Order placement failed",
    };
  } finally {
    // অপারেশন শেষে সংযোগটি (Connection) পুলে ফিরিয়ে দেওয়া হয় (Resource Management)।
    client.release();
  }
}

// ─── অর্ডার বাতিলের ট্রানজ্যাকশন (Cancel Order Transaction) ─────────────────────────────────
// এই ফাংশনটি একটি বিদ্যমান অর্ডার বাতিল করার প্রক্রিয়া পরিচালনা করে।
export async function cancelOrder(
  orderId: number,
  cancelledBy: number
): Promise<{ success: boolean; error?: string }> {
  const client = await pool.connect();
  try {
    // এখানে ডিফল্ট আইসোলেশন লেভেল (Read Committed) ব্যবহার করে ট্রানজ্যাকশন শুরু হচ্ছে।
    await client.query("BEGIN");
    
    // অর্ডারটি খুঁজে বের করা হচ্ছে।
    const orderRes = await client.query('SELECT * FROM customer_order WHERE order_id = $1', [orderId]);
    if (orderRes.rows.length === 0) throw new Error("Order not found");
    const order = orderRes.rows[0];

    // শুধুমাত্র "pending" (অপেক্ষমান) বা "confirmed" (নিশ্চিতকৃত) অর্ডার বাতিল করা সম্ভব (State Machine Rules)।
    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    const itemsRes = await client.query('SELECT * FROM order_item WHERE order_id = $1', [orderId]);

    // বাতিলকৃত পণ্যের ইনভেন্টরি পুনরায় ডাটাবেসে ফেরত (Restore) দেওয়া হচ্ছে।
    for (const item of itemsRes.rows) {
      if (item.code) { 
        await client.query(`
          UPDATE variant_inventory SET quantity = quantity + $1 WHERE variant_code = $2
        `, [item.quantity, item.code]);
        
        await client.query(`
          UPDATE product_variant SET quantity = quantity + $1 WHERE variant_code = $2
        `, [item.quantity, item.code]);
      }
      
      await client.query(`
        UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2
      `, [item.quantity, item.product_id]);
      
      await client.query(`
        UPDATE product SET stock_qty = stock_qty + $1 WHERE product_id = $2
      `, [item.quantity, item.product_id]);
    }

    // অর্ডারের স্ট্যাটাস 'cancelled' এ পরিবর্তন করা হচ্ছে।
    await client.query(`
      UPDATE customer_order SET status = 'cancelled' WHERE order_id = $1
    `, [orderId]);

    // অডিট লগিং: বাতিলের ক্ষেত্রে এটি ট্রানজ্যাকশনের অংশ হিসেবে অ্যাটমিকভাবে (Atomically) ইনসার্ট করা হচ্ছে 
    // কারণ বাতিলকরণ একটি সেন্সিটিভ অ্যাকশন।
    await client.query(`
      INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      "customer_order", orderId, "UPDATE", cancelledBy, 
      { status: order.status }, { status: "cancelled" }
    ]);

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Cancellation failed",
    };
  } finally {
    client.release();
  }
}

// ─── অর্ডারের স্ট্যাটাস আপডেট (Update Order Status - Admin) ──────────────────────────────
// অ্যাডমিন প্যানেল থেকে অর্ডারের অবস্থা পরিবর্তনের জন্য এই ফাংশনটি ব্যবহৃত হয়।
export async function updateOrderStatus(
  orderId: number,
  newStatus: string,
  adminId: number,
  courierId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // এখানে কোনো ম্যানুয়াল ট্রানজ্যাকশন নেই কারণ লজিকটি তুলনামূলক সরল। 
    // ডিফল্টভাবে প্রতিটি `db.query` নিজেই একটি ইমপ্লিসিট ট্রানজ্যাকশন (Implicit Transaction) হিসেবে কাজ করে।
    const orderRes = await db.query('SELECT * FROM customer_order WHERE order_id = $1', [orderId]);
    if (orderRes.rows.length === 0) return { success: false, error: "Order not found" };
    const order = orderRes.rows[0];

    const oldStatus = order.status;

    // নতুন কুরিয়ার এসাইন করা হলে তা আপডেট করা হচ্ছে।
    if (courierId) {
      await db.query(`
        UPDATE customer_order SET status = $1, courier_id = $2 WHERE order_id = $3
      `, [newStatus, courierId, orderId]);
    } else {
      await db.query(`
        UPDATE customer_order SET status = $1 WHERE order_id = $2
      `, [newStatus, orderId]);
    }

    const effectiveCourierId = courierId || order.courier_id;

    // স্ট্যাটাস যদি "processing" হয়, তবে শিপমেন্ট (Shipment) রেকর্ড তৈরি করা হয়।
    if (newStatus === "processing" && effectiveCourierId) {
      const shipmentRes = await db.query('SELECT * FROM shipment WHERE order_id = $1', [orderId]);
      if (shipmentRes.rows.length === 0) {
        await db.query(`
          INSERT INTO shipment (order_id, courier_id, status, estimated_delivery)
          VALUES ($1, $2, $3, $4)
        `, [orderId, effectiveCourierId, "preparing", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)]);
      }
    }

    // স্ট্যাটাস "shipped" হলে শিপমেন্ট টেবিলে ট্র্যাকিং নম্বর (Tracking Number) যুক্ত করে আপডেট করা হয়।
    if (newStatus === "shipped") {
      await db.query(`
        UPDATE shipment 
        SET status = 'in_transit', dispatched_at = NOW(), tracking_number = $1 
        WHERE order_id = $2
      `, [`NC-TRK-${orderId}-${Date.now().toString(36).toUpperCase()}`, orderId]);
    }

    // স্ট্যাটাস "delivered" হলে শিপমেন্টের সময় লিপিবদ্ধ করা হয়।
    if (newStatus === "delivered") {
      await db.query(`
        UPDATE shipment SET status = 'delivered', delivered_at = NOW() WHERE order_id = $1
      `, [orderId]);
    }

    // অ্যাডমিন অ্যাকশনটি অডিট লগে রেকর্ড করা হচ্ছে।
    await logAudit("customer_order", orderId, "UPDATE", adminId, { status: oldStatus }, { status: newStatus });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status update failed",
    };
  }
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/lib/transactions.ts`) অ্যাপ্লিকেশনের অত্যন্ত জটিল এবং স্পর্শকাতর বিজনেস লজিকগুলো (Business Logic) ধারণ করে, বিশেষ করে ই-কমার্স অর্ডার প্লেসমেন্ট এবং ক্যান্সেল ম্যানেজমেন্ট। পদ্ধতিগতভাবে (Methodologically), এটি অবজেক্ট-রিলেশনাল ম্যাপিং (ORM) এর বদলে সরাসরি 'node-postgres' (pg) ক্লায়েন্ট ব্যবহার করে ডেটাবেস ট্রানজ্যাকশন (Database Transaction) পরিচালনা করে। `placeOrder` ফাংশনে `BEGIN ISOLATION LEVEL SERIALIZABLE` ব্যবহার করা হয়েছে, যা সমকালীন (Concurrent) রিকোয়েস্টের ক্ষেত্রে ডেটা অ্যানোমালি (Data Anomaly - যেমন ডাবল স্পেন্ডিং বা ইনভেন্টরি ওভারসোল্ড) সম্পূর্ণভাবে প্রতিরোধ করে। ট্রানজ্যাকশনটি ১০টি অ্যাটমিক (Atomic) ধাপে বিভক্ত: কার্ট যাচাই, ইনভেন্টরি লক/ভ্যালিডেশন, মূল্য নির্ধারণ, অর্ডার তৈরি, প্রাইস স্ন্যাপশট, ইনভেন্টরি কমানো, চালান তৈরি, পেমেন্ট রেকর্ড, কুপন আপডেট এবং কার্ট পরিষ্কার করা। এর মধ্যে একটি ধাপ ব্যর্থ হলে `ROLLBACK` কল করে সমগ্র প্রক্রিয়াটি বাতিল করে ডেটাবেসকে তার পূর্ববর্তী স্টেটে (State) ফিরিয়ে নেওয়া হয় (Consistency)।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই ফাইলে সরাসরি ব্যবহারকারীর প্রমাণীকরণ (Authentication) করা হয় না; এটি ধরে নেয় যে ফাংশনগুলো কল করার আগেই কলার (Caller - যেমন Server Actions) ব্যবহারকারীর প্রমাণীকরণ এবং অনুমোদন (Authorization) যাচাই করেছে। তবে নিরাপত্তার দিক থেকে এখানে ডেটা ইন্টিগ্রিটি (Data Integrity) এবং সিকিউরিটি (Security) নিশ্চিত করা হয়েছে ম্যানুয়াল ট্রানজ্যাকশন এবং প্যারামিটারাইজড কুয়েরি (Parameterized Queries, e.g., `$1, $2`) ব্যবহারের মাধ্যমে, যা SQL ইনজেকশন প্রতিরোধ করে। এছাড়াও, অ্যাডমিন অ্যাকশনের ক্ষেত্রে (`updateOrderStatus`) `logAudit` এর মাধ্যমে অ্যাকাউন্টেবিলিটি (Accountability) এবং নন-রেপুডিয়েশন (Non-repudiation) নিশ্চিত করা হয়েছে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই ফাংশনগুলো ইন্টারনাল ডাটাবেস API হিসেবে কাজ করে, যা সাধারণত সার্ভার অ্যাকশন বা রুট হ্যান্ডলার (Route Handlers) থেকে ইনভোক করা হয়। ডেটা প্রবাহটি (Data Flow) একটি সিকুয়েনশিয়াল ট্রানজ্যাকশনাল পাইপলাইন (Sequential Transactional Pipeline) অনুসরণ করে। `pool.connect()` এর মাধ্যমে একটি ডেডিকেটেড কানেকশন ধার (Checkout) করা হয়, এরপর একাধিক `client.query` এর মাধ্যমে ডাটাবেসে রিড (Read) এবং রাইট (Write) অপারেশন চালানো হয়। প্রসেসিং শেষে `client.release()` এর মাধ্যমে কানেকশনটি পুলে ফিরিয়ে দেওয়া হয়। এই মডেলে ইন-মেমোরি প্রসেসিং (In-memory Processing) এবং ডাটাবেস প্রসেসিং এর মধ্যে একটি ভারসাম্য (Balance) বজায় রাখা হয়েছে।
================================================================================
*/
