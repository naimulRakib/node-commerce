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
