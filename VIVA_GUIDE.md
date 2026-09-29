# 🎓 NodeCommerce — CSE216 Checklist Verification & Viva Guide

---

## ✅ CHECKLIST STATUS

| # | Requirement | Status | Where |
|---|-------------|--------|-------|
| 1 | User Authentication (own code, JWT) | ✅ DONE | `src/lib/auth.ts` |
| 2 | Auth Validation on Every Page | ✅ DONE | All admin + account pages |
| 3 | Explicit Transaction Control (COMMIT/ROLLBACK) | ✅ DONE | `src/lib/transactions.ts` |
| 4 | Use of Triggers (1+) | ✅ DONE | **5 triggers** in PostgreSQL |
| 5 | Use of Functions | ✅ DONE | **2 business functions** in PostgreSQL |
| 6 | Use of Procedures | ✅ DONE | **2 stored procedures** in PostgreSQL |
| 7 | Complex Queries (3+) | ✅ DONE | analytics, orders, customers pages |

---

## 1. USER AUTHENTICATION

> **File:** [`src/lib/auth.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/auth.ts)

- **Technology:** `jose` library with `HS256` algorithm
- **Storage:** `HttpOnly Cookie` (XSS-safe, cannot be accessed by JavaScript)
- **Token Expiry:** 7 days
- **Own code:** No third-party service like Firebase/Auth0

```typescript
// JWT টোকেন তৈরি
await new SignJWT({ id, email, name, role })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("7d")
  .sign(JWT_SECRET);

// টোকেন যাচাই
const { payload } = await jwtVerify(token, JWT_SECRET);
```

**Demo command:**
```bash
# Login করলে cookies-এ session_token দেখা যাবে
curl -c cookies.txt http://localhost:3000/api/auth/login
```

---

## 2. AUTH ON EVERY PAGE

**Admin pages (all protected with `requireAdmin()`):**
- `/admin` → dashboard
- `/admin/analytics`
- `/admin/categories`
- `/admin/coupons`
- `/admin/couriers`
- `/admin/customers`
- `/admin/orders` + `/admin/orders/[id]`
- `/admin/products` + `/admin/products/new` + `/admin/products/[id]/edit`

**Customer pages (protected with `requireCustomer()`):**
- `/account`, `/account/orders`, `/account/profile`, `/account/wallet`, `/account/wishlist`
- `/checkout`

```typescript
// প্রতিটি admin page-এর শুরুতে:
export default async function AdminXxxPage() {
  // প্রমাণীকরণ যাচাই — ব্যর্থ হলে /admin/login-এ redirect
  await requireAdmin();
  // ... বাকি কোড
}
```

---

## 3. EXPLICIT TRANSACTIONS

> **File:** [`src/lib/transactions.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/transactions.ts)

### `placeOrder()` — সবচেয়ে জটিল transaction

```typescript
const client = await pool.connect(); // dedicated connection
try {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  // Step 1: Cart fetch
  // Step 2: Stock validation (throws if insufficient)
  // Step 3: Coupon validation
  // Step 4: Price calculation (VAT 5%, shipping, discount)
  // Step 5: INSERT customer_order
  // Step 6: INSERT order_item × N + UPDATE inventory
  // Step 7: INSERT invoice
  // Step 8: INSERT payment + DELETE cart_item
  await client.query("COMMIT");    // সব সফল
} catch (error) {
  await client.query("ROLLBACK");  // যেকোনো ব্যর্থতায় সব বাতিল
} finally {
  client.release();               // connection pool-এ ফেরত
}
```

**ACID Properties:**
| Property | কীভাবে |
|---------|--------|
| Atomicity | BEGIN/COMMIT/ROLLBACK |
| Consistency | FK constraints + CHECK constraints + Triggers |
| Isolation | SERIALIZABLE — race condition প্রতিরোধ |
| Durability | PostgreSQL WAL (Write-Ahead Log) |

---

## 4. TRIGGERS (5টি)

```sql
-- সব trigger দেখতে:
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers WHERE trigger_schema = 'public';
```

| Trigger Name | Table | Event | Timing | কাজ |
|-------------|-------|-------|--------|-----|
| `trg_restore_inventory_on_cancel` | customer_order | UPDATE | AFTER | Cancel হলে stock ফেরত |
| `trg_cashback_on_delivery` | customer_order | UPDATE | AFTER | Delivered হলে 2% cashback |
| `trg_enforce_coupon_limit` | customer_order | INSERT/UPDATE | BEFORE | Coupon limit enforce |
| `trg_update_rating_on_review` | review | INSERT/UPDATE/DELETE | AFTER | avg_rating auto-update |
| `trg_product_updated_at` | product | UPDATE | BEFORE | timestamp auto-refresh |

**Live Demo (trigger 2 test):**
```sql
-- আগের rating দেখুন
SELECT product_id, avg_rating, review_count FROM product WHERE product_id = 14;
-- নতুন review দিন
INSERT INTO review (product_id, customer_id, rating, comment) VALUES (14, 1, 5, 'test');
-- trigger স্বয়ংক্রিয়ভাবে avg_rating আপডেট করেছে
SELECT product_id, avg_rating, review_count FROM product WHERE product_id = 14;
```

---

## 5. FUNCTIONS (2টি business + 5টি trigger support)

```sql
-- সব function দেখতে:
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

### `fn_get_customer_lifetime_value(customer_id)`
একজন customer-এর সামগ্রিক মূল্য ফেরত দেয়:
```sql
SELECT * FROM fn_get_customer_lifetime_value(1);
-- Returns: total_orders, total_spent, total_discount, wallet_balance, avg_order_value, total_reviews
```

### `fn_get_product_revenue_stats(product_id)`
একটি পণ্যের বিক্রয় পরিসংখ্যান ফেরত দেয়:
```sql
SELECT * FROM fn_get_product_revenue_stats(14);
-- Returns: product_name, units_sold, total_revenue, avg_rating, review_count, stock_remaining
```

**Sir জিজ্ঞেস করলে:** "Function ব্যবহার করেছি কারণ এই computed values application level-এ calculate করলে multiple queries লাগতো। Database function একটি কলেই সব aggregation করে দেয়।"

---

## 6. STORED PROCEDURES (2টি)

```sql
-- সব procedure দেখতে:
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'PROCEDURE';
```

### `proc_place_return_request(order_id, customer_id, product_id, reason)`
Multi-step workflow — ৬টি ধাপ:
```sql
CALL proc_place_return_request(9, 1, 16, 'Product defective');
```
**ভেতরে যা হয়:**
1. `order_item` থেকে unit_price ও quantity SELECT
2. `return_request` INSERT → `return_id` পাওয়া
3. Refund amount = unit_price × quantity গণনা
4. `refund` INSERT (return_id দিয়ে linked)
5. Inventory পুনরুদ্ধার (variant বা product update)
6. `notification` INSERT → customer informed

### `proc_deactivate_expired_coupons()`
মেয়াদোত্তীর্ণ কুপন batch deactivation:
```sql
CALL proc_deactivate_expired_coupons();
-- NOTICE: Deactivated 3 expired/exhausted coupons.
```

**Sir জিজ্ঞেস করলে:** "Procedure ব্যবহার করেছি কারণ return request-এ ৬টি আলাদা টেবিলে কাজ হয়। Application layer থেকে একটি CALL-এই সব হয়, transaction management database নিজেই করে।"

---

## 7. COMPLEX QUERIES (3+)

### Query 1 — Multi-table JOIN with aggregation (Analytics)
```sql
SELECT p.name, SUM(oi.quantity) as total_qty_sold,
       SUM(oi.quantity * oi.unit_price) as total_revenue,
       AVG(r.rating) as avg_rating, COUNT(DISTINCT r.review_id) as review_count
FROM product p
LEFT JOIN order_item oi ON oi.product_id = p.product_id
LEFT JOIN customer_order co ON co.order_id = oi.order_id AND co.status != 'cancelled'
LEFT JOIN review r ON r.product_id = p.product_id
GROUP BY p.product_id ORDER BY total_qty_sold DESC LIMIT 10
```

### Query 2 — Correlated Subquery (Customer details)
```sql
SELECT c.*,
  (SELECT COUNT(*) FROM customer_order o WHERE o.customer_id = c.customer_id) AS orders_count,
  (SELECT COUNT(*) FROM review r WHERE r.customer_id = c.customer_id) AS reviews_count
FROM customer c
```

### Query 3 — Window/Aggregation with FILTER (Monthly Revenue)
```sql
SELECT DATE_TRUNC('month', order_date) as month,
       COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
       SUM(total_amount) FILTER (WHERE status = 'delivered') as revenue
FROM customer_order
GROUP BY month ORDER BY month DESC LIMIT 6
```

---

## 📋 VIVA Q&A (10টি সম্ভাব্য প্রশ্ন)

### ❓ Function এবং Procedure-এর পার্থক্য?
> **Function** একটি মান **return** করে (`RETURNS TABLE` বা scalar value) এবং SELECT-এ ব্যবহার করা যায়। **Procedure** কোনো value return করে না — multi-step workflow modify করে, `CALL` দিয়ে invoke হয়। আমার `fn_get_customer_lifetime_value()` function কারণ এটি computed stats return করে। আর `proc_place_return_request()` procedure কারণ এটি ৬টি টেবিল modify করে।

### ❓ BEFORE এবং AFTER trigger-এর পার্থক্য?
> `BEFORE` — data লেখার আগে চলে, `NEW` row modify বা reject করা যায়। `AFTER` — data লেখার পরে চলে, side-effects করা যায়। আমার coupon limit trigger `BEFORE` কারণ সেটি INSERT/UPDATE reject করে (`RAISE EXCEPTION`).

### ❓ Transaction কেন SERIALIZABLE isolation level ব্যবহার করেছ?
> `placeOrder()`-এ শেষ item দুজন একসাথে কিনতে চাইলে race condition হতে পারে। SERIALIZABLE isolation এটি রোধ করে — একজনের transaction সফল হলে অন্যজনটি ROLLBACK হয়।

### ❓ Connection Pool কী এবং কেন pool.connect() ব্যবহার করলে?
> Pool একগুচ্ছ pre-established DB connection রাখে। `pool.connect()` একটি dedicated client দেয় — কারণ একটি transaction একই connection-এ থাকতে হয়। `BEGIN` একটি connection-এ, `COMMIT` অন্য connection-এ করলে transaction কাজ করে না।

### ❓ Foreign Key CASCADE DELETE কোথায় ব্যবহার করলে?
> `order_item`, `payment`, `shipment`, `invoice` — সব `customer_order ON DELETE CASCADE`. কিন্তু `product`-এ `ON DELETE RESTRICT` — কারণ ordered product delete করা উচিত না।

### ❓ Parameterized query কী?
> `$1, $2` placeholder ব্যবহার করে user input inject করা। PostgreSQL driver নিজেই value escape করে — SQL Injection প্রতিরোধ হয়। `db.query('SELECT * FROM customer WHERE email = $1', [email])`

### ❓ Audit log কেন?
> Non-repudiation — কে, কখন, কোন order confirm করেছে তার immutable record। `old_data (JSONB) → new_data (JSONB)` — পূর্ব ও পরের state উভয়ই সংরক্ষিত।

### ❓ JWT কী এবং HttpOnly Cookie কেন?
> JWT হলো ক্রিপ্টোগ্রাফিকভাবে signed token যা user info বহন করে। HttpOnly cookie-তে রাখলে JavaScript দিয়ে পড়া যায় না — XSS attack থেকে সুরক্ষিত।

### ❓ requireAdmin() কীভাবে কাজ করে?
> Cookie থেকে JWT পড়ে, verify করে, role চেক করে। Role 'admin' বা 'super_admin' না হলে `/admin/login`-এ redirect করে। প্রতিটি admin page-এর শুরুতে call করা হয়।

### ❓ trigger কি transaction-এর ভেতরে চলে?
> হ্যাঁ! Trigger সবসময় triggering statement-এর একই transaction-এ চলে। `AFTER` trigger-এ যদি exception হয়, পুরো transaction ROLLBACK হয়। তাই trigger-এর কাজ ACID-compliant।

---

## 🔑 KEY FILES

| ফাইল | মূল বিষয় |
|------|---------|
| [`src/lib/transactions.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/transactions.ts) | BEGIN/COMMIT/ROLLBACK |
| [`src/lib/auth.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/auth.ts) | JWT + requireAdmin/requireCustomer |
| [`src/lib/audit.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/audit.ts) | Audit trail |
| [`src/actions/admin.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/actions/admin.ts) | Order actions (confirm, ship, deliver) |
| [`src/lib/db.ts`](file:///Users/naimulislam/Desktop/Lightborn/node_commerce/web/src/lib/db.ts) | Connection Pool |

---

> [!TIP]
> **pgweb Live Demo:** Sir কে live দেখাতে — `http://localhost:5657` খুলুন। সেখানে trigger, function, procedure সব দেখা যাবে এবং SQL চালিয়ে demonstrate করতে পারবেন।
