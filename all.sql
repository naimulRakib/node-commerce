-- ============================================================
-- NodeCommerce — সম্পূর্ণ ডাটাবেস অবজেক্ট ফাইল
-- Triggers, Functions & Procedures
-- Generated from live PostgreSQL database
-- ============================================================


-- ══════════════════════════════════════════════════════════════
--   SECTION 1: TRIGGER SUPPORT FUNCTIONS (5টি)
--   এই functions শুধু trigger-এর ভেতর থেকে call হয়।
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION 1: fn_set_updated_at
-- কাজ: যেকোনো UPDATE-এ updated_at টাইমস্ট্যাম্প auto-set করে
-- ব্যবহার: trg_product_updated_at trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;


-- ──────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION 2: fn_update_product_rating
-- কাজ: review INSERT/UPDATE/DELETE হলে product.avg_rating
--       এবং product.review_count স্বয়ংক্রিয়ভাবে recalculate করে
-- ব্যবহার: trg_update_rating_on_review trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_product_rating()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE product
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM review
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM review
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$function$;


-- ──────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION 3: fn_cashback_on_delivery
-- কাজ: order status 'delivered' হলে মোট order-এর 2% cashback
--       customer-এর wallet-এ যোগ করে এবং notification পাঠায়
-- ব্যবহার: trg_cashback_on_delivery trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_cashback_on_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cashback_amount NUMERIC;
  cust_id INTEGER;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    cashback_amount := ROUND(NEW.total_amount * 0.02, 2);
    cust_id := NEW.customer_id;

    UPDATE wallet
    SET balance = balance + cashback_amount,
        updated_at = NOW()
    WHERE customer_id = cust_id;

    INSERT INTO notification (customer_id, type, message)
    VALUES (
      cust_id,
      'cashback',
      '🎉 ৳' || cashback_amount || ' cashback credited to your wallet for Order #' || NEW.order_id || '!'
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ──────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION 4: fn_restore_inventory_on_cancel
-- কাজ: order cancel হলে order_item থেকে প্রতিটি product-এর
--       stock ফেরত দেয় (variant থাকলে variant, না হলে master)
-- ব্যবহার: trg_restore_inventory_on_cancel trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_restore_inventory_on_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR item IN
      SELECT product_id, quantity, code FROM order_item WHERE order_id = NEW.order_id
    LOOP
      IF item.code IS NOT NULL THEN
        UPDATE product_variant
        SET quantity = quantity + item.quantity
        WHERE variant_code = item.code;
      ELSE
        UPDATE product
        SET stock_qty = stock_qty + item.quantity
        WHERE product_id = item.product_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;


-- ──────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION 5: fn_enforce_coupon_usage_limit
-- কাজ: order INSERT-এর আগে coupon-এর usage limit চেক করে।
--       limit পার হলে RAISE EXCEPTION → transaction ROLLBACK হয়।
--       সফল হলে coupon.usage_count বাড়িয়ে দেয়।
-- ব্যবহার: trg_enforce_coupon_limit trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_enforce_coupon_usage_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  max_uses INTEGER;
  current_uses INTEGER;
BEGIN
  IF NEW.coupon_code IS NOT NULL AND (OLD.coupon_code IS NULL OR OLD.coupon_code <> NEW.coupon_code) THEN
    SELECT usage_limit, usage_count
    INTO max_uses, current_uses
    FROM coupon
    WHERE code = NEW.coupon_code;

    -- usage_limit NULL মানে সীমাহীন ব্যবহার অনুমোদিত
    IF max_uses IS NOT NULL AND current_uses >= max_uses THEN
      RAISE EXCEPTION 'Coupon "%" has reached its maximum usage limit of %.', NEW.coupon_code, max_uses;
    END IF;

    UPDATE coupon SET usage_count = usage_count + 1 WHERE code = NEW.coupon_code;
  END IF;
  RETURN NEW;
END;
$function$;


-- ══════════════════════════════════════════════════════════════
--   SECTION 2: TRIGGER BINDINGS (5টি)
--   উপরের functions-কে নির্দিষ্ট টেবিলের event-এর সাথে bind করা
-- ══════════════════════════════════════════════════════════════


-- TRIGGER 1: product UPDATE হলে updated_at auto-set
DROP TRIGGER IF EXISTS trg_product_updated_at ON product;
CREATE TRIGGER trg_product_updated_at
  BEFORE UPDATE ON product
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- TRIGGER 2: review INSERT/UPDATE/DELETE হলে avg_rating recalculate
DROP TRIGGER IF EXISTS trg_update_rating_on_review ON review;
CREATE TRIGGER trg_update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON review
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_product_rating();

-- TRIGGER 3: order 'delivered' হলে 2% cashback wallet-এ যোগ
DROP TRIGGER IF EXISTS trg_cashback_on_delivery ON customer_order;
CREATE TRIGGER trg_cashback_on_delivery
  AFTER UPDATE ON customer_order
  FOR EACH ROW
  EXECUTE FUNCTION fn_cashback_on_delivery();

-- TRIGGER 4: order 'cancelled' হলে stock ফেরত দাও
DROP TRIGGER IF EXISTS trg_restore_inventory_on_cancel ON customer_order;
CREATE TRIGGER trg_restore_inventory_on_cancel
  AFTER UPDATE ON customer_order
  FOR EACH ROW
  EXECUTE FUNCTION fn_restore_inventory_on_cancel();

-- TRIGGER 5: order INSERT-এর আগে coupon limit enforce করো
DROP TRIGGER IF EXISTS trg_enforce_coupon_limit ON customer_order;
CREATE TRIGGER trg_enforce_coupon_limit
  BEFORE INSERT ON customer_order
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_coupon_usage_limit();


-- ══════════════════════════════════════════════════════════════
--   SECTION 3: BUSINESS FUNCTIONS (2টি)
--   SELECT দিয়ে সরাসরি call করা যায়।
--   Demo: SELECT * FROM fn_get_customer_lifetime_value(1);
--   Demo: SELECT * FROM fn_get_product_revenue_stats(14);
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
-- FUNCTION 6: fn_get_customer_lifetime_value(customer_id)
-- কাজ: একজন customer-এর সম্পূর্ণ পরিসংখ্যান বের করে
-- Returns: total_orders, total_spent, total_discount,
--          wallet_balance, avg_order_value, total_reviews
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_get_customer_lifetime_value(p_customer_id integer)
 RETURNS TABLE(
   total_orders    bigint,
   total_spent     numeric,
   total_discount  numeric,
   wallet_balance  numeric,
   avg_order_value numeric,
   total_reviews   bigint
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT co.order_id)::BIGINT                              AS total_orders,
    COALESCE(SUM(co.total_amount) FILTER (WHERE co.status = 'delivered'), 0) AS total_spent,
    COALESCE(SUM(co.discount_amount), 0)                             AS total_discount,
    COALESCE(w.balance, 0)                                           AS wallet_balance,
    COALESCE(AVG(co.total_amount) FILTER (WHERE co.status = 'delivered'), 0) AS avg_order_value,
    COUNT(DISTINCT r.review_id)::BIGINT                              AS total_reviews
  FROM customer c
  LEFT JOIN customer_order co ON co.customer_id = c.customer_id
  LEFT JOIN wallet w          ON w.customer_id  = c.customer_id
  LEFT JOIN review r          ON r.customer_id  = c.customer_id
  WHERE c.customer_id = p_customer_id
  GROUP BY w.balance;
END;
$function$;


-- ──────────────────────────────────────────────────────────────
-- FUNCTION 7: fn_get_product_revenue_stats(product_id)
-- কাজ: একটি product-এর revenue ও performance statistics বের করে
-- Returns: product_name, units_sold, total_revenue,
--          avg_rating, review_count, stock_remaining
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_get_product_revenue_stats(p_product_id integer)
 RETURNS TABLE(
   product_name    character varying,
   units_sold      bigint,
   total_revenue   numeric,
   avg_rating      numeric,
   review_count    integer,
   stock_remaining integer
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.name::VARCHAR,
    COALESCE(SUM(oi.quantity), 0)::BIGINT                       AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0)               AS total_revenue,
    COALESCE(p.avg_rating, 0),
    COALESCE(p.review_count, 0),
    p.stock_qty
  FROM product p
  LEFT JOIN order_item oi     ON oi.product_id = p.product_id
  LEFT JOIN customer_order co ON co.order_id   = oi.order_id
                              AND co.status NOT IN ('cancelled')
  WHERE p.product_id = p_product_id
  GROUP BY p.product_id, p.name, p.avg_rating, p.review_count, p.stock_qty;
END;
$function$;


-- ══════════════════════════════════════════════════════════════
--   SECTION 4: STORED PROCEDURES (2টি)
--   CALL দিয়ে execute করতে হয়।
--   Demo: CALL proc_place_return_request(9, 1, 16, 'Defective');
--   Demo: CALL proc_deactivate_expired_coupons();
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
-- PROCEDURE 1: proc_place_return_request(order_id, customer_id, product_id, reason)
-- কাজ: ৬ ধাপে return request process করে —
--   ধাপ ১: order_item থেকে unit_price ও variant নেওয়া
--   ধাপ ২: return_request INSERT → return_id পাওয়া
--   ধাপ ৩: refund amount = unit_price × quantity গণনা
--   ধাপ ৪: refund INSERT (return_id দিয়ে linked)
--   ধাপ ৫: inventory restore
--   ধাপ ৬: customer notification INSERT
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE PROCEDURE public.proc_place_return_request(
  IN p_order_id    integer,
  IN p_customer_id integer,
  IN p_product_id  integer,
  IN p_reason      character varying
)
 LANGUAGE plpgsql
AS $procedure$
DECLARE
  v_unit_price  NUMERIC;
  v_quantity    INTEGER;
  v_variant     VARCHAR;
  v_return_id   INTEGER;
  v_refund_amt  NUMERIC;
BEGIN
  -- ধাপ ১: order_item থেকে unit_price, quantity এবং variant_code নেওয়া
  SELECT oi.unit_price, oi.quantity, oi.code
  INTO v_unit_price, v_quantity, v_variant
  FROM order_item oi
  WHERE oi.order_id = p_order_id AND oi.product_id = p_product_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found for order_id=% and product_id=%', p_order_id, p_product_id;
  END IF;

  -- ধাপ ২: return_request INSERT (return_id পাওয়া)
  INSERT INTO return_request (order_id, product_id, reason, status)
  VALUES (p_order_id, p_product_id, p_reason, 'requested')
  RETURNING return_id INTO v_return_id;

  -- ধাপ ৩: refund amount গণনা
  v_refund_amt := v_unit_price * v_quantity;

  -- ধাপ ৪: refund INSERT (return_id দিয়ে linked)
  INSERT INTO refund (return_id, amount, status)
  VALUES (v_return_id, v_refund_amt, 'pending');

  -- ধাপ ৫: inventory পুনরুদ্ধার
  IF v_variant IS NOT NULL THEN
    UPDATE product_variant SET quantity = quantity + v_quantity WHERE variant_code = v_variant;
  ELSE
    UPDATE product SET stock_qty = stock_qty + v_quantity WHERE product_id = p_product_id;
  END IF;

  -- ধাপ ৬: customer notification
  INSERT INTO notification (customer_id, type, message)
  VALUES (
    p_customer_id,
    'return_update',
    'Your return request for Order #' || p_order_id ||
    ' (Return ID: ' || v_return_id || ') has been received. Refund of ৳' ||
    v_refund_amt || ' is being processed.'
  );

  RAISE NOTICE 'Return request placed. Return ID: %, Refund: BDT %', v_return_id, v_refund_amt;
END;
$procedure$;


-- ──────────────────────────────────────────────────────────────
-- PROCEDURE 2: proc_deactivate_expired_coupons()
-- কাজ: মেয়াদোত্তীর্ণ (expiry_date পার) বা usage limit শেষ
--       সব coupon is_active = FALSE করে দেয়
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE PROCEDURE public.proc_deactivate_expired_coupons()
 LANGUAGE plpgsql
AS $procedure$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE coupon
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND (
      (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE)
      OR
      (usage_limit IS NOT NULL AND usage_count >= usage_limit)
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deactivated % expired/exhausted coupons.', v_count;
END;
$procedure$;


-- ══════════════════════════════════════════════════════════════
--   QUICK DEMO (Sir-কে দেখানোর জন্য)
-- ══════════════════════════════════════════════════════════════
-- SELECT tgname, relname FROM pg_trigger JOIN pg_class ON tgrelid = oid WHERE NOT tgisinternal;
-- SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public';
-- SELECT * FROM fn_get_customer_lifetime_value(1);
-- SELECT * FROM fn_get_product_revenue_stats(14);
-- CALL proc_deactivate_expired_coupons();
-- CALL proc_place_return_request(9, 1, 16, 'Product defective');
