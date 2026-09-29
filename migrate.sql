-- ============================================================================
-- NodeCommerce — Migration Script (মাইগ্রেশন স্ক্রিপ্ট)
-- ============================================================================
-- এই স্ক্রিপ্টটি বিদ্যমান টেবিলগুলোতে নতুন কলাম যোগ করে এবং নতুন টেবিল তৈরি করে।
-- এটি নিরাপদ (Non-destructive): বিদ্যমান কোনো ডেটা মুছে ফেলে না।
-- IF NOT EXISTS ব্যবহার করায় স্ক্রিপ্টটি একাধিকবার চালালেও কোনো সমস্যা হবে না।

-- ─── 1. PRODUCT টেবিল: মিসিং কলামগুলো যোগ করা ──────────────────────────────
-- কোড 'base_price', 'is_active', 'created_at', 'category_id', 'description' ব্যবহার করে।
ALTER TABLE product
  ADD COLUMN IF NOT EXISTS base_price     NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS category_id   INTEGER REFERENCES category(category_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS image_url     VARCHAR(500),
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP NOT NULL DEFAULT now();

-- বিদ্যমান 'price' কলাম থেকে 'base_price' পপুলেট করা।
UPDATE product SET base_price = price WHERE base_price IS NULL;

-- ─── 2. CATEGORY টেবিল: parent_category_id কলাম যোগ করা ───────────────────
ALTER TABLE category
  ADD COLUMN IF NOT EXISTS parent_category_id INTEGER REFERENCES category(category_id) ON DELETE SET NULL;

-- ─── 3. CUSTOMER_ORDER টেবিল: শিপিং ও মূল্য সংক্রান্ত কলাম যোগ করা ────────
ALTER TABLE customer_order
  ADD COLUMN IF NOT EXISTS shipping_address_id INTEGER,
  ADD COLUMN IF NOT EXISTS subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee        NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ─── 4. CART_ITEM টেবিল: variant_code কলাম যোগ করা ─────────────────────────
ALTER TABLE cart_item
  ADD COLUMN IF NOT EXISTS variant_code VARCHAR(60);

-- ─── 5. COUPON টেবিল: উন্নত ডিসকাউন্ট লজিকের জন্য কলাম যোগ করা ─────────────
ALTER TABLE coupon
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS usage_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit    INTEGER,
  ADD COLUMN IF NOT EXISTS discount_type  VARCHAR(20) NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount   NUMERIC(10,2);

-- বিদ্যমান 'discount_pt' থেকে 'discount_value' পপুলেট করা।
UPDATE coupon SET discount_value = discount_pt WHERE discount_value = 0 AND discount_pt IS NOT NULL;

-- ─── 6. PAYMENT টেবিল: স্ট্যাটাস ও পেমেন্টের সময় যোগ করা ──────────────────
ALTER TABLE payment
  ADD COLUMN IF NOT EXISTS status   VARCHAR(30) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at  TIMESTAMP;

-- ─── 7. INVOICE টেবিল: ট্যাক্স রেট যোগ করা ─────────────────────────────────
ALTER TABLE invoice
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 5.0;

-- ─── 8. COURIER টেবিল: email ও is_active কলাম যোগ করা ───────────────────────
ALTER TABLE courier
  ADD COLUMN IF NOT EXISTS email     VARCHAR(150),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─── 9. ADMIN টেবিল তৈরি করা ─────────────────────────────────────────────────
-- Customer টেবিল থেকে আলাদা রাখা হয়েছে — Security Best Practice।
CREATE TABLE IF NOT EXISTS admin (
  admin_id      SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'admin',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ─── 10. AUDIT_LOG টেবিল: সঠিক স্কিমা নিশ্চিত করা ────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  log_id      SERIAL PRIMARY KEY,
  table_name  VARCHAR(60) NOT NULL,
  record_id   INTEGER NOT NULL,
  action      VARCHAR(20) NOT NULL,
  changed_by  INTEGER,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ─── 11. ADDRESS টেবিল ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS address (
  address_id    SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  label         VARCHAR(40) NOT NULL DEFAULT 'home',
  address_line1 VARCHAR(250) NOT NULL,
  address_line2 VARCHAR(250),
  city          VARCHAR(80) NOT NULL,
  district      VARCHAR(80),
  postal_code   VARCHAR(20),
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_address_customer ON address(customer_id);

-- ─── 12. NOTIFICATION টেবিল (singular) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification (
  notification_id SERIAL PRIMARY KEY,
  customer_id     INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  type            VARCHAR(40),
  message         VARCHAR(500),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_customer ON notification(customer_id);

-- ─── 13. SHIPMENT টেবিল ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipment (
  shipment_id        SERIAL PRIMARY KEY,
  order_id           INTEGER NOT NULL UNIQUE REFERENCES customer_order(order_id) ON DELETE CASCADE,
  courier_id         INTEGER REFERENCES courier(courier_id) ON DELETE SET NULL,
  status             VARCHAR(30) NOT NULL DEFAULT 'preparing',
  tracking_number    VARCHAR(100),
  dispatched_at      TIMESTAMP,
  estimated_delivery TIMESTAMP,
  delivered_at       TIMESTAMP,
  created_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipment_order ON shipment(order_id);

-- ─── 14. VARIANT_INVENTORY টেবিল ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS variant_inventory (
  id           SERIAL PRIMARY KEY,
  variant_code VARCHAR(60) NOT NULL UNIQUE REFERENCES product_variant(variant_code) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- ─── 15. ইনডেক্স যোগ করা ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_is_active ON product(is_active);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON product(created_at DESC);

-- ─── 16. WISHLIST টেবিল নিশ্চিত করা ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  wishlist_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL UNIQUE REFERENCES customer(customer_id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wishlist_item (
  wishlist_item_id SERIAL PRIMARY KEY,
  wishlist_id      INTEGER NOT NULL REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  variant_code     VARCHAR(60) REFERENCES product_variant(variant_code) ON DELETE SET NULL,
  added_at         TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (wishlist_id, product_id)
);
-- ============================================================================
-- CSE216 Checklist: Triggers, Functions, and Procedures
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: Shadow Table for Logging Sensitive Actions
-- We create an audit table to track price changes on the product table.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_price_audit (
    audit_id        SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL,
    old_price       NUMERIC(12,2),
    new_price       NUMERIC(12,2),
    changed_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Trigger Function
CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price <> OLD.price THEN
        INSERT INTO product_price_audit(product_id, old_price, new_price)
        VALUES(NEW.product_id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Definition
DROP TRIGGER IF EXISTS trg_log_price_change ON product;
CREATE TRIGGER trg_log_price_change
AFTER UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION log_product_price_change();


-- ----------------------------------------------------------------------------
-- 2. FUNCTION: Returning a Statistical or Computed Value
-- Function to calculate the total amount spent by a specific customer.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_total_spent(p_customer_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total
    FROM customer_order
    WHERE customer_id = p_customer_id AND status != 'cancelled';
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 3. PROCEDURE: Multi-step Workflow Modifying Several Tables
-- Procedure to process a refund request, updating both return_request and refund tables.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE process_product_refund(
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_reason VARCHAR(300),
    p_refund_amount NUMERIC(12,2),
    p_payment_method VARCHAR(40)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_return_id INTEGER;
BEGIN
    -- Step 1: Insert into return_request
    INSERT INTO return_request(order_id, product_id, reason, status)
    VALUES (p_order_id, p_product_id, p_reason, 'approved')
    RETURNING return_id INTO v_return_id;

    -- Step 2: Insert into refund
    INSERT INTO refund(return_id, amount, payment_method, status, processed_at)
    VALUES (v_return_id, p_refund_amount, p_payment_method, 'completed', now());

    -- Step 3: Optional - update order status if needed (assuming full refund for simplicity)
    UPDATE customer_order 
    SET status = 'refunded' 
    WHERE order_id = p_order_id;
    
    -- Transaction is implicitly handled within the procedure block by PostgreSQL unless EXCEPTION block exists,
    -- allowing atomic execution.
END;
$$;
