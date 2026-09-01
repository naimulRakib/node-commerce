

CREATE TABLE category (
    category_id     SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE product (
    product_id      SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    product_code    VARCHAR(60)  NOT NULL UNIQUE,
    price           NUMERIC(12,2) NOT NULL,
    stock_qty       INTEGER NOT NULL DEFAULT 0
);

-- hi ! ami naimul
CREATE TABLE product_variant (
    variant_code    VARCHAR(60) PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES category(category_id) ON DELETE SET NULL,
    color           VARCHAR(40),
    sku             VARCHAR(60) NOT NULL UNIQUE,
    size            VARCHAR(20),
    quantity        INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- media: Has relationship, a variant Has many media assets (1:N)
CREATE TABLE media (
    media_no        SERIAL PRIMARY KEY,
    variant_code    VARCHAR(60) NOT NULL REFERENCES product_variant(variant_code) ON DELETE CASCADE,
    image_url       VARCHAR(500),
    video_snippet   VARCHAR(500),
    description     VARCHAR(300)
);

-- ---------- Inventory: Warehouse / Inventory ------------------------------

CREATE TABLE warehouse (
    warehouse_no    SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    city            VARCHAR(80),
    capacity        INTEGER
);

-- inventory: located_at Warehouse (N:1), Stocked_in Product (N:1)
CREATE TABLE inventory (
    inventory_id    SERIAL PRIMARY KEY,
    warehouse_no    INTEGER NOT NULL REFERENCES warehouse(warehouse_no) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 0,
    record_level    INTEGER,
    last_updated    TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- People: Customer / Profile / Wallet / Referral ----------------

CREATE TABLE customer (
    customer_id     SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    phone           VARCHAR(20),
    email           VARCHAR(150) NOT NULL UNIQUE,
    payment_method  VARCHAR(40)
);

-- profile: represents Customer (1:1)
CREATE TABLE profile (
    profile_id       SERIAL PRIMARY KEY,
    customer_id      INTEGER NOT NULL UNIQUE REFERENCES customer(customer_id) ON DELETE CASCADE,
    full_name        VARCHAR(150),
    present_address  VARCHAR(250),
    gender           VARCHAR(20),
    image_url        VARCHAR(500)
);

-- wallet: Holds Customer (1:1)
CREATE TABLE wallet (
    wallet_id       SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL UNIQUE REFERENCES customer(customer_id) ON DELETE CASCADE,
    balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
    bank_adress     VARCHAR(200),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- referral: refers / Writes -> one customer refers another via a referral record (N:1 to referrer)
CREATE TABLE referral (
    referral_id           SERIAL PRIMARY KEY,
    referrer_customer_id  INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    code                  VARCHAR(40) NOT NULL UNIQUE,
    referred_email        VARCHAR(150),
    status                VARCHAR(30) NOT NULL DEFAULT 'pending',
    reward_amount         NUMERIC(10,2) DEFAULT 0
);

-- support_ticket: Raises Customer (N:1)
CREATE TABLE support_ticket (
    ticket_id       SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    subject         VARCHAR(200) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'open',
    priority        VARCHAR(20) NOT NULL DEFAULT 'normal',
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- notifications: Receives Customer (N:1)
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    type            VARCHAR(40),
    message         VARCHAR(500),
    sent_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- Review ----------------------------------------------------


CREATE TABLE review (
    review_id       SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    customer_id     INTEGER REFERENCES customer(customer_id) ON DELETE SET NULL,  -- assumption
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         VARCHAR(1000),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- Cart / Cart_item (Cart<->Product is M:N, resolved by Cart_item) --


CREATE TABLE cart (
    cart_id         SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- cart_item: Contains Cart (N:1) + Contains Product (N:1) -- this table
-- IS the M:N junction between Cart and Product, with its own attributes.
CREATE TABLE cart_item (
    cart_item_id    SERIAL PRIMARY KEY,
    cart_id         INTEGER NOT NULL REFERENCES cart(cart_id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1,
    line_no         INTEGER,
    added_at        TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (cart_id, product_id)
);

-- ---------- Coupon / Courier -------------------------------------------

CREATE TABLE coupon (
    code            VARCHAR(40) PRIMARY KEY,
    min_spend       NUMERIC(10,2) DEFAULT 0,
    expiry_date     DATE,
    discount_pt     NUMERIC(5,2) NOT NULL
);

CREATE TABLE courier (
    courier_id      SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    phone           VARCHAR(20),
    coverage_area   VARCHAR(150)
);

-- ---------- Order / Order_item / Payment / Invoice ----------------------

-- "order" is a reserved word in SQL -> quoted, or renamed customer_order.
-- Using customer_order to avoid needing to quote it everywhere.
CREATE TABLE customer_order (
    order_id        SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    courier_id      INTEGER REFERENCES courier(courier_id) ON DELETE SET NULL,
    coupon_code     VARCHAR(40) REFERENCES coupon(code) ON DELETE SET NULL,
    order_date      TIMESTAMP NOT NULL DEFAULT now(),
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- order_item: Specifies Product (N:1) -- the M:N junction between Order and Product
CREATE TABLE order_item (
    order_item_id   SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES customer_order(order_id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12,2) NOT NULL,
    code            VARCHAR(60)
);

-- payment: Paid_via Order (N:1) -- allows multiple payments per order

CREATE TABLE payment (
    payment_id      SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES customer_order(order_id) ON DELETE CASCADE,
    txid            VARCHAR(100) NOT NULL UNIQUE,
    amount          NUMERIC(12,2) NOT NULL,
    method          VARCHAR(40) NOT NULL
);

-- invoice: Receives / Has Order (1:1)
CREATE TABLE invoice (
    invoice_id      SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL UNIQUE REFERENCES customer_order(order_id) ON DELETE CASCADE,
    issued_at       TIMESTAMP NOT NULL DEFAULT now(),
    tax_amount      NUMERIC(10,2) DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'issued'
);

-- ---------- Return / Refund ---------------------------------------------


CREATE TABLE return_request (
    return_id       SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES customer_order(order_id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES product(product_id) ON DELETE RESTRICT,
    requested_time  TIMESTAMP NOT NULL DEFAULT now(),
    reason          VARCHAR(300),
    status          VARCHAR(30) NOT NULL DEFAULT 'requested'
);

-- refund: Results_in Return_request (1:1)
CREATE TABLE refund (
    refund_id       SERIAL PRIMARY KEY,
    return_id       INTEGER NOT NULL UNIQUE REFERENCES return_request(return_id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_method  VARCHAR(40),
    processed_at    TIMESTAMP
);

-- ============================================================================
-- Helpful indexes on FK columns (Postgres doesn't auto-index FKs)
-- ============================================================================
CREATE INDEX idx_product_variant_product   ON product_variant(product_id);
CREATE INDEX idx_product_variant_category  ON product_variant(category_id);
CREATE INDEX idx_media_variant             ON media(variant_code);
CREATE INDEX idx_inventory_warehouse       ON inventory(warehouse_no);
CREATE INDEX idx_inventory_product         ON inventory(product_id);
CREATE INDEX idx_review_product            ON review(product_id);
CREATE INDEX idx_review_customer           ON review(customer_id);
CREATE INDEX idx_cart_customer             ON cart(customer_id);
CREATE INDEX idx_cart_item_cart            ON cart_item(cart_id);
CREATE INDEX idx_cart_item_product         ON cart_item(product_id);
CREATE INDEX idx_order_customer            ON customer_order(customer_id);
CREATE INDEX idx_order_courier             ON customer_order(courier_id);
CREATE INDEX idx_order_coupon              ON customer_order(coupon_code);
CREATE INDEX idx_order_item_order          ON order_item(order_id);
CREATE INDEX idx_order_item_product        ON order_item(product_id);
CREATE INDEX idx_payment_order             ON payment(order_id);
CREATE INDEX idx_return_request_order      ON return_request(order_id);
CREATE INDEX idx_return_request_product    ON return_request(product_id);
CREATE INDEX idx_support_ticket_customer   ON support_ticket(customer_id);
CREATE INDEX idx_notifications_customer    ON notifications(customer_id);
CREATE INDEX idx_referral_referrer         ON referral(referrer_customer_id);
