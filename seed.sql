-- ============================================================================
-- NodeCommerce — Seed Data Script (সিড ডেটা স্ক্রিপ্ট)
-- ============================================================================
-- এই স্ক্রিপ্টটি ডেমো ডেটা দিয়ে ডাটাবেস পপুলেট করে।
-- চালানোর আগে: psql -U naimulislam -d web_db -f seed.sql
-- ============================================================================

-- আগের ডেমো ডেটা ক্লিয়ার করা (cascade এর কারণে সব সাব-রেকর্ডও মুছে যাবে)
DELETE FROM product_variant WHERE product_id IN (SELECT product_id FROM product WHERE product_code LIKE 'NC-%');
DELETE FROM product WHERE product_code LIKE 'NC-%';
DELETE FROM category WHERE name IN ('Electronics','Fashion','Home & Living','Footwear','Beauty','Gaming','Phones','Laptops','Audio','Watches');
DELETE FROM admin WHERE email = 'admin@nodecommerce.com';
DELETE FROM coupon WHERE code IN ('SAVE10','FLAT50','WELCOME20');
DELETE FROM courier WHERE name IN ('Pathao Courier','Sundarban Courier');

-- ─── ১. ক্যাটাগরি ডেটা (Category Data) ─────────────────────────────────────
-- ই-কমার্স সাইটের প্রধান পণ্য বিভাগসমূহ
INSERT INTO category (name) VALUES
  ('Electronics'),
  ('Fashion'),
  ('Home & Living'),
  ('Footwear'),
  ('Beauty'),
  ('Gaming')
ON CONFLICT DO NOTHING;

-- ─── ২. প্রোডাক্ট ডেটা (Product Data) ──────────────────────────────────────
-- ১২টি ডেমো প্রোডাক্ট — বিভিন্ন ক্যাটাগরি থেকে
INSERT INTO product (name, product_code, price, base_price, description, category_id, is_active, created_at, stock_qty) VALUES
  ('Samsung Galaxy A55 5G', 'NC-PHN-001', 32999, 32999,
   'Samsung Galaxy A55 5G স্মার্টফোন। ৫০MP ক্যামেরা, 5000mAh ব্যাটারি, 8GB RAM।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '5 days', 50),

  ('Apple iPhone 15 (128GB)', 'NC-PHN-002', 129999, 129999,
   'Apple iPhone 15 — অত্যাধুনিক A16 Bionic চিপ, 48MP ক্যামেরা সিস্টেম।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '3 days', 20),

  ('Xiaomi Redmi Note 13 Pro', 'NC-PHN-003', 24999, 24999,
   'Redmi Note 13 Pro — 200MP ক্যামেরা, 5100mAh ব্যাটারি, 12GB RAM।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '7 days', 75),

  ('Dell Inspiron 15 Laptop', 'NC-LAP-001', 65000, 65000,
   'Dell Inspiron 15 — Intel Core i5, 16GB RAM, 512GB SSD, Windows 11।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '2 days', 15),

  ('Sony WH-1000XM5 Headphones', 'NC-AUD-001', 34999, 34999,
   'Sony WH-1000XM5 ওয়্যারলেস হেডফোন — শিল্পের সেরা নয়েজ ক্যান্সেলিং।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '4 days', 30),

  ('Classic Cotton Polo Shirt', 'NC-FSH-001', 890, 890,
   'প্রিমিয়াম কটন পোলো শার্ট — আরামদায়ক ফিট, একাধিক রঙে পাওয়া যায়।',
   (SELECT category_id FROM category WHERE name='Fashion'), true, NOW() - INTERVAL '6 days', 200),

  ('Slim Fit Chino Pants', 'NC-FSH-002', 1299, 1299,
   'স্লিম ফিট চিনো প্যান্ট — অফিস এবং ক্যাজুয়াল উভয় অনুষ্ঠানের জন্য।',
   (SELECT category_id FROM category WHERE name='Fashion'), true, NOW() - INTERVAL '8 days', 150),

  ('Nike Air Max 270', 'NC-FTW-001', 12999, 12999,
   'Nike Air Max 270 রানিং শু — এয়ার ইউনিট কুশনিং, হালকা ওজন।',
   (SELECT category_id FROM category WHERE name='Footwear'), true, NOW() - INTERVAL '1 day', 40),

  ('Ceramic Coffee Mug Set', 'NC-HOM-001', 699, 699,
   'সিরামিক কফি মগ সেট (৬ পিস) — মাইক্রোওয়েভ ও ডিশওয়াশার নিরাপদ।',
   (SELECT category_id FROM category WHERE name='Home & Living'), true, NOW() - INTERVAL '9 days', 100),

  ('PS5 DualSense Controller', 'NC-GAM-001', 8999, 8999,
   'PlayStation 5 DualSense ওয়্যারলেস কন্ট্রোলার — হ্যাপটিক ফিডব্যাক সহ।',
   (SELECT category_id FROM category WHERE name='Gaming'), true, NOW() - INTERVAL '2 days', 25),

  ('L''Oreal Paris Serum', 'NC-BTY-001', 1490, 1490,
   'L''Oreal Paris Revitalift হায়ালুরনিক অ্যাসিড সিরাম — ৭২ ঘন্টা হাইড্রেশন।',
   (SELECT category_id FROM category WHERE name='Beauty'), true, NOW() - INTERVAL '5 days', 80),

  ('Casio Digital Watch', 'NC-ELC-002', 3999, 3999,
   'Casio G-Shock ডিজিটাল ওয়াচ — ওয়াটার রেসিস্ট্যান্ট, সোলার পাওয়ার।',
   (SELECT category_id FROM category WHERE name='Electronics'), true, NOW() - INTERVAL '3 days', 35);

-- ─── ৩. প্রোডাক্ট ভ্যারিয়েন্ট ডেটা (Product Variants) ──────────────────────
-- প্রতিটি প্রোডাক্টের রঙ বা সাইজ ভিত্তিক ভ্যারিয়েন্ট
INSERT INTO product_variant (variant_code, product_id, sku, color, size, quantity) VALUES
  ('VAR-PHN-001-BLK', (SELECT product_id FROM product WHERE product_code='NC-PHN-001'), 'SKU-A55-BLK', 'Black', NULL, 25),
  ('VAR-PHN-001-BLU', (SELECT product_id FROM product WHERE product_code='NC-PHN-001'), 'SKU-A55-BLU', 'Blue', NULL, 25),
  ('VAR-PHN-002-BLK', (SELECT product_id FROM product WHERE product_code='NC-PHN-002'), 'SKU-IP15-BLK-128', 'Black', '128GB', 10),
  ('VAR-PHN-002-WHT', (SELECT product_id FROM product WHERE product_code='NC-PHN-002'), 'SKU-IP15-WHT-128', 'White', '128GB', 10),
  ('VAR-PHN-003-BLK', (SELECT product_id FROM product WHERE product_code='NC-PHN-003'), 'SKU-RN13-BLK', 'Black', NULL, 40),
  ('VAR-LAP-001-SLV', (SELECT product_id FROM product WHERE product_code='NC-LAP-001'), 'SKU-DELL-I15-SLV', 'Silver', 'i5/16GB', 8),
  ('VAR-AUD-001-BLK', (SELECT product_id FROM product WHERE product_code='NC-AUD-001'), 'SKU-WH1000-BLK', 'Black', NULL, 15),
  ('VAR-AUD-001-WHT', (SELECT product_id FROM product WHERE product_code='NC-AUD-001'), 'SKU-WH1000-WHT', 'White', NULL, 15),
  ('VAR-FSH-001-S',   (SELECT product_id FROM product WHERE product_code='NC-FSH-001'), 'SKU-POLO-S', 'Navy Blue', 'S', 50),
  ('VAR-FSH-001-M',   (SELECT product_id FROM product WHERE product_code='NC-FSH-001'), 'SKU-POLO-M', 'Navy Blue', 'M', 70),
  ('VAR-FSH-001-L',   (SELECT product_id FROM product WHERE product_code='NC-FSH-001'), 'SKU-POLO-L', 'Navy Blue', 'L', 80),
  ('VAR-FSH-002-30',  (SELECT product_id FROM product WHERE product_code='NC-FSH-002'), 'SKU-CHINO-30', 'Khaki', '30', 40),
  ('VAR-FSH-002-32',  (SELECT product_id FROM product WHERE product_code='NC-FSH-002'), 'SKU-CHINO-32', 'Khaki', '32', 50),
  ('VAR-FTW-001-8',   (SELECT product_id FROM product WHERE product_code='NC-FTW-001'), 'SKU-AM270-8', 'Black/White', '8', 10),
  ('VAR-FTW-001-9',   (SELECT product_id FROM product WHERE product_code='NC-FTW-001'), 'SKU-AM270-9', 'Black/White', '9', 15),
  ('VAR-FTW-001-10',  (SELECT product_id FROM product WHERE product_code='NC-FTW-001'), 'SKU-AM270-10', 'Black/White', '10', 15),
  ('VAR-HOM-001-SET', (SELECT product_id FROM product WHERE product_code='NC-HOM-001'), 'SKU-MUG-6PC', 'White', '6 Piece Set', 30),
  ('VAR-GAM-001-WHT', (SELECT product_id FROM product WHERE product_code='NC-GAM-001'), 'SKU-DS5-WHT', 'White', NULL, 12),
  ('VAR-GAM-001-BLK', (SELECT product_id FROM product WHERE product_code='NC-GAM-001'), 'SKU-DS5-BLK', 'Black', NULL, 13),
  ('VAR-BTY-001-30ML',(SELECT product_id FROM product WHERE product_code='NC-BTY-001'), 'SKU-LOR-30ML', 'N/A', '30ml', 40),
  ('VAR-ELC-002-BLK', (SELECT product_id FROM product WHERE product_code='NC-ELC-002'), 'SKU-CAS-GS-BLK', 'Black', NULL, 18);

-- ─── ৪. ইনভেন্টরি (Inventory) — সকল প্রোডাক্টের স্টক সেট করা ──────────────
-- একটি ডিফল্ট ওয়্যারহাউস তৈরি করা
INSERT INTO warehouse (name, city, capacity) VALUES ('Dhaka Central Warehouse', 'Dhaka', 10000)
ON CONFLICT DO NOTHING;

INSERT INTO inventory (warehouse_no, product_id, quantity)
SELECT 
  (SELECT warehouse_no FROM warehouse LIMIT 1),
  product_id,
  stock_qty
FROM product WHERE product_code LIKE 'NC-%'
ON CONFLICT DO NOTHING;

-- ─── ৫. কুপন ডেটা (Coupon Data) ─────────────────────────────────────────────
-- ডিসকাউন্ট কুপন — গ্রাহকরা চেকআউটের সময় ব্যবহার করতে পারবেন
INSERT INTO coupon (code, discount_type, discount_value, min_spend, max_discount, expiry_date, is_active, discount_pt) VALUES
  ('SAVE10',    'percentage', 10.00, 500,  500,  '2027-12-31', true, 10.00),
  ('FLAT50',    'fixed',      50.00, 299,  NULL, '2027-12-31', true, 0.00),
  ('WELCOME20', 'percentage', 20.00, 1000, 300,  '2027-12-31', true, 20.00)
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  is_active = true;

-- ─── ৬. কুরিয়ার ডেটা (Courier Data) ────────────────────────────────────────
INSERT INTO courier (name, phone, coverage_area, is_active) VALUES
  ('Pathao Courier', '01700000001', 'Dhaka, Chittagong, Sylhet', true),
  ('Sundarban Courier', '01800000002', 'Nationwide', true)
ON CONFLICT DO NOTHING;

-- ─── ৭. অ্যাডমিন ইউজার (Admin User) ────────────────────────────────────────
-- পাসওয়ার্ড: Admin@1234
-- bcrypt hash (cost factor 12) — এটি একটি প্রি-কম্পিউটেড হ্যাশ
-- IMPORTANT: শুধুমাত্র ডেমো ও ডেভেলপমেন্টের জন্য। প্রোডাকশনে নতুন হ্যাশ ব্যবহার করুন।
INSERT INTO admin (name, email, password_hash, role, is_active) VALUES
  ('Super Admin', 'admin@nodecommerce.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/OzCOG3e',
   'super_admin', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = true;

-- ─── ৮. ডেমো কাস্টমারের জন্য সংশ্লিষ্ট রেকর্ড নিশ্চিত করা ──────────────────
-- বিদ্যমান customer_id = 1 এর জন্য cart, wallet, profile, wishlist নিশ্চিত করা
INSERT INTO cart (customer_id) 
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM cart WHERE customer_id = 1);

INSERT INTO wallet (customer_id, balance)
SELECT 1, 0 WHERE NOT EXISTS (SELECT 1 FROM wallet WHERE customer_id = 1);

INSERT INTO profile (customer_id, full_name)
SELECT 1, 'Rahim Uddin' WHERE NOT EXISTS (SELECT 1 FROM profile WHERE customer_id = 1);

INSERT INTO wishlist (customer_id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM wishlist WHERE customer_id = 1);

-- ─── ৯. কিছু ডেমো রিভিউ (Demo Reviews) ─────────────────────────────────────
INSERT INTO review (product_id, customer_id, rating, comment) VALUES
  ((SELECT product_id FROM product WHERE product_code='NC-PHN-001'), 1, 5, 'অসাধারণ ফোন! ক্যামেরা খুব ভালো।'),
  ((SELECT product_id FROM product WHERE product_code='NC-LAP-001'), 1, 4, 'Dell Inspiron খুব ভালো পারফরম্যান্স দিচ্ছে।'),
  ((SELECT product_id FROM product WHERE product_code='NC-AUD-001'), 1, 5, 'Sony হেডফোনের নয়েজ ক্যান্সেলিং অবিশ্বাস্য!')
ON CONFLICT DO NOTHING;

-- ─── ১০. ভেরিফিকেশন কুয়েরি (Verification Queries) ────────────────────────────
SELECT 'Categories' as entity, COUNT(*) FROM category
UNION ALL
SELECT 'Products', COUNT(*) FROM product WHERE is_active = true
UNION ALL
SELECT 'Variants', COUNT(*) FROM product_variant
UNION ALL
SELECT 'Admin Users', COUNT(*) FROM admin
UNION ALL
SELECT 'Coupons', COUNT(*) FROM coupon
UNION ALL
SELECT 'Couriers', COUNT(*) FROM courier;

-- ─── ১১. ডেমো কাস্টমার (Demo Customers) ─────────────────────────────────────
-- পাসওয়ার্ড: customer123 (bcrypt hash)
-- এই কাস্টমারগুলো অ্যানালিটিক্স ডেমোর জন্য দরকার
INSERT INTO customer (name, email, phone, password_hash, is_verified, is_active) VALUES
  ('Rahim Uddin',    'test@example.com',   '01700000001', '$2b$10$3euPcmQFCiblsZeEu6Z7/.NY9KKhRU/OoilRlHUd2YSuMj8BnM7CK', true, true),
  ('Karim Hossain',  'karim@example.com',  '01800000002', '$2b$10$3euPcmQFCiblsZeEu6Z7/.NY9KKhRU/OoilRlHUd2YSuMj8BnM7CK', true, true),
  ('Nadia Islam',    'nadia@example.com',  '01900000003', '$2b$10$3euPcmQFCiblsZeEu6Z7/.NY9KKhRU/OoilRlHUd2YSuMj8BnM7CK', true, true),
  ('Sumon Ahmed',    'sumon@example.com',  '01600000004', '$2b$10$3euPcmQFCiblsZeEu6Z7/.NY9KKhRU/OoilRlHUd2YSuMj8BnM7CK', true, true),
  ('Sadia Khanam',   'sadia@example.com',  '01500000005', '$2b$10$3euPcmQFCiblsZeEu6Z7/.NY9KKhRU/OoilRlHUd2YSuMj8BnM7CK', true, true)
ON CONFLICT (email) DO NOTHING;

-- কাস্টমারদের জন্য cart, wallet, profile, wishlist তৈরি করা
INSERT INTO cart (customer_id)
SELECT customer_id FROM customer WHERE email IN ('test@example.com','karim@example.com','nadia@example.com','sumon@example.com','sadia@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO wallet (customer_id, balance)
SELECT customer_id, 0 FROM customer WHERE email IN ('test@example.com','karim@example.com','nadia@example.com','sumon@example.com','sadia@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO profile (customer_id, full_name)
SELECT customer_id, name FROM customer WHERE email IN ('test@example.com','karim@example.com','nadia@example.com','sumon@example.com','sadia@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO wishlist (customer_id)
SELECT customer_id FROM customer WHERE email IN ('test@example.com','karim@example.com','nadia@example.com','sumon@example.com','sadia@example.com')
ON CONFLICT DO NOTHING;

-- ─── ১২. ডেমো অর্ডার ডেটা (Demo Orders — for Analytics) ──────────────────────
-- পুরনো ডেমো অর্ডার মুছে ফেলা (যদি থাকে)
-- ami naimul: এই অর্ডারগুলো analytics পেজে চার্ট দেখানোর জন্য দরকার

-- অর্ডার ১: Samsung Phone — delivered (এই মাসে)
INSERT INTO customer_order (customer_id, courier_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id, 
  (SELECT courier_id FROM courier LIMIT 1),
  NOW() - INTERVAL '5 days',
  'delivered',
  35998.00,
  35998.00,
  0
FROM customer c WHERE c.email = 'test@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ২: Laptop + Headphone — delivered (গত মাসে)
INSERT INTO customer_order (customer_id, courier_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id,
  (SELECT courier_id FROM courier LIMIT 1),
  NOW() - INTERVAL '35 days',
  'delivered',
  99999.00,
  99999.00,
  0
FROM customer c WHERE c.email = 'karim@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৩: Fashion items — shipped (এই মাসে)
INSERT INTO customer_order (customer_id, courier_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id,
  (SELECT courier_id FROM courier LIMIT 1),
  NOW() - INTERVAL '10 days',
  'shipped',
  4377.00,
  4377.00,
  100
FROM customer c WHERE c.email = 'nadia@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৪: Gaming + Beauty — pending (আজকে)
INSERT INTO customer_order (customer_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id,
  NOW() - INTERVAL '1 day',
  'pending',
  10489.00,
  10489.00,
  0
FROM customer c WHERE c.email = 'sumon@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৫: iPhone — confirmed (এই মাসে)
INSERT INTO customer_order (customer_id, courier_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id,
  (SELECT courier_id FROM courier LIMIT 1),
  NOW() - INTERVAL '3 days',
  'confirmed',
  129999.00,
  129999.00,
  0
FROM customer c WHERE c.email = 'sadia@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৬: আরও কিছু পুরনো অর্ডার (২ মাস আগে)
INSERT INTO customer_order (customer_id, order_date, status, total_amount, subtotal, shipping_fee)
SELECT 
  c.customer_id,
  NOW() - INTERVAL '65 days',
  'delivered',
  24999.00,
  24999.00,
  0
FROM customer c WHERE c.email = 'test@example.com'
ON CONFLICT DO NOTHING;

-- ─── ১৩. অর্ডার আইটেম (Order Items) ─────────────────────────────────────────
-- অর্ডার ১ এর আইটেম: Samsung Galaxy
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  32999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-PHN-001'
WHERE c.email = 'test@example.com' AND co.status = 'delivered' AND co.total_amount = 35998.00
ON CONFLICT DO NOTHING;

INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  2999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-ELC-002'
WHERE c.email = 'test@example.com' AND co.status = 'delivered' AND co.total_amount = 35998.00
ON CONFLICT DO NOTHING;

-- অর্ডার ২ এর আইটেম: Laptop + Headphone
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  65000.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-LAP-001'
WHERE c.email = 'karim@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  34999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-AUD-001'
WHERE c.email = 'karim@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৩ এর আইটেম: Polo + Chino
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  2,
  890.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-FSH-001'
WHERE c.email = 'nadia@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  2,
  1299.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-FSH-002'
WHERE c.email = 'nadia@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৪ এর আইটেম: Gaming + Beauty
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  8999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-GAM-001'
WHERE c.email = 'sumon@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  1490.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-BTY-001'
WHERE c.email = 'sumon@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৫ এর আইটেম: iPhone
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  129999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-PHN-002'
WHERE c.email = 'sadia@example.com'
ON CONFLICT DO NOTHING;

-- অর্ডার ৬ এর আইটেম: Redmi (পুরনো অর্ডার)
INSERT INTO order_item (order_id, product_id, quantity, unit_price)
SELECT 
  co.order_id,
  p.product_id,
  1,
  24999.00
FROM customer_order co
JOIN customer c ON co.customer_id = c.customer_id
JOIN product p ON p.product_code = 'NC-PHN-003'
WHERE c.email = 'test@example.com' AND co.total_amount = 24999.00
ON CONFLICT DO NOTHING;

-- ─── ১৪. পেমেন্ট রেকর্ড (Payments) ──────────────────────────────────────────
INSERT INTO payment (order_id, txid, amount, method, status, paid_at)
SELECT 
  co.order_id,
  CONCAT('TXN-', co.order_id, '-', FLOOR(RANDOM() * 99999)::text),
  co.total_amount,
  CASE co.status 
    WHEN 'delivered' THEN 'bkash'
    WHEN 'shipped' THEN 'nagad'
    WHEN 'confirmed' THEN 'card'
    ELSE 'cod'
  END,
  CASE WHEN co.status IN ('delivered','shipped','confirmed') THEN 'completed' ELSE 'pending' END,
  CASE WHEN co.status IN ('delivered','shipped','confirmed') THEN co.order_date + INTERVAL '30 minutes' ELSE NULL END
FROM customer_order co
WHERE NOT EXISTS (SELECT 1 FROM payment pm WHERE pm.order_id = co.order_id)
LIMIT 10;

-- ─── ১৫. ইনভয়েস (Invoices) ──────────────────────────────────────────────────
INSERT INTO invoice (order_id, tax_amount, tax_rate, status)
SELECT 
  co.order_id,
  ROUND(co.total_amount * 0.05, 2),
  5.0,
  CASE WHEN co.status IN ('delivered','shipped','confirmed') THEN 'issued' ELSE 'draft' END
FROM customer_order co
WHERE NOT EXISTS (SELECT 1 FROM invoice iv WHERE iv.order_id = co.order_id)
LIMIT 10;

-- ─── ১৬. আরও রিভিউ যোগ করা (More Reviews for PSS data) ─────────────────────
-- বিভিন্ন প্রোডাক্টের রিভিউ যোগ করা
DO $$
DECLARE
  v_cust1 INTEGER;
  v_cust2 INTEGER;
  v_cust3 INTEGER;
BEGIN
  SELECT customer_id INTO v_cust1 FROM customer WHERE email = 'karim@example.com';
  SELECT customer_id INTO v_cust2 FROM customer WHERE email = 'nadia@example.com';
  SELECT customer_id INTO v_cust3 FROM customer WHERE email = 'sumon@example.com';

  IF v_cust1 IS NOT NULL THEN
    INSERT INTO review (product_id, customer_id, rating, comment) VALUES
      ((SELECT product_id FROM product WHERE product_code='NC-LAP-001'), v_cust1, 5, 'Dell laptop performance is amazing! Great for coding.'),
      ((SELECT product_id FROM product WHERE product_code='NC-AUD-001'), v_cust1, 4, 'Sony WH1000XM5 headphone noise cancelling is next level.'),
      ((SELECT product_id FROM product WHERE product_code='NC-PHN-002'), v_cust1, 5, 'iPhone 15 is worth every penny!')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_cust2 IS NOT NULL THEN
    INSERT INTO review (product_id, customer_id, rating, comment) VALUES
      ((SELECT product_id FROM product WHERE product_code='NC-FSH-001'), v_cust2, 4, 'Polo shirt fabric quality is very good. Comfortable fit.'),
      ((SELECT product_id FROM product WHERE product_code='NC-FSH-002'), v_cust2, 4, 'Chino pants perfect for office. Loved the khaki color.'),
      ((SELECT product_id FROM product WHERE product_code='NC-BTY-001'), v_cust2, 5, 'LOreal serum worked great! Skin feels hydrated.')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_cust3 IS NOT NULL THEN
    INSERT INTO review (product_id, customer_id, rating, comment) VALUES
      ((SELECT product_id FROM product WHERE product_code='NC-GAM-001'), v_cust3, 5, 'PS5 controller feels premium. Haptic feedback is great!'),
      ((SELECT product_id FROM product WHERE product_code='NC-FTW-001'), v_cust3, 3, 'Nike Air Max ok but price is a bit high.'),
      ((SELECT product_id FROM product WHERE product_code='NC-HOM-001'), v_cust3, 4, 'Mug set looks nice. Good quality ceramic.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ─── ১৭. ফাইনাল ভেরিফিকেশন (Final Verification) ────────────────────────────
SELECT 'Orders' as entity, COUNT(*) FROM customer_order
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_item
UNION ALL
SELECT 'Payments', COUNT(*) FROM payment
UNION ALL
SELECT 'Customers', COUNT(*) FROM customer
UNION ALL
SELECT 'Reviews', COUNT(*) FROM review;

