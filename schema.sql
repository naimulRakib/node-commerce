--
-- PostgreSQL database dump
--

\restrict vjTpvTOrwQUPVbik6APIa4JiB9bkOH9ooCZjwRDhM1DxG0HfRcGPNQ5bLR9DAKX

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: prisma_contract; Type: SCHEMA; Schema: -; Owner: naimulislam
--

CREATE SCHEMA prisma_contract;


ALTER SCHEMA prisma_contract OWNER TO naimulislam;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: marker; Type: TABLE; Schema: prisma_contract; Owner: naimulislam
--

CREATE TABLE prisma_contract.marker (
    space text DEFAULT 'app'::text NOT NULL,
    core_hash text NOT NULL,
    profile_hash text NOT NULL,
    contract_json jsonb,
    canonical_version integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    app_tag text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    invariants text[] DEFAULT '{}'::text[] NOT NULL
);


ALTER TABLE prisma_contract.marker OWNER TO naimulislam;

--
-- Name: address; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.address (
    address_id integer NOT NULL,
    customer_id integer NOT NULL,
    label character varying(40) DEFAULT 'home'::character varying NOT NULL,
    address_line1 character varying(200) NOT NULL,
    address_line2 character varying(200),
    city character varying(80) NOT NULL,
    district character varying(80),
    postal_code character varying(20),
    country character varying(80) DEFAULT 'Bangladesh'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.address OWNER TO naimulislam;

--
-- Name: address_address_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.address_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.address_address_id_seq OWNER TO naimulislam;

--
-- Name: address_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.address_address_id_seq OWNED BY public.address.address_id;


--
-- Name: admin; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.admin (
    admin_id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) DEFAULT 'admin'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin OWNER TO naimulislam;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.admin_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_admin_id_seq OWNER TO naimulislam;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.admin_admin_id_seq OWNED BY public.admin.admin_id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    table_name character varying(60) NOT NULL,
    record_id integer NOT NULL,
    action character varying(20) NOT NULL,
    changed_by integer,
    old_data jsonb,
    new_data jsonb,
    changed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO naimulislam;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_log_id_seq OWNER TO naimulislam;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- Name: cart; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    customer_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cart OWNER TO naimulislam;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_cart_id_seq OWNER TO naimulislam;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;


--
-- Name: cart_item; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.cart_item (
    cart_item_id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    line_no integer,
    added_at timestamp without time zone DEFAULT now() NOT NULL,
    variant_code character varying(60)
);


ALTER TABLE public.cart_item OWNER TO naimulislam;

--
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.cart_item_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_item_cart_item_id_seq OWNER TO naimulislam;

--
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.cart_item_cart_item_id_seq OWNED BY public.cart_item.cart_item_id;


--
-- Name: category; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.category (
    category_id integer NOT NULL,
    name character varying(120) NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    parent_category_id integer
);


ALTER TABLE public.category OWNER TO naimulislam;

--
-- Name: category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.category_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_category_id_seq OWNER TO naimulislam;

--
-- Name: category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.category_category_id_seq OWNED BY public.category.category_id;


--
-- Name: coupon; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.coupon (
    code character varying(40) NOT NULL,
    min_spend numeric(10,2) DEFAULT 0,
    expiry_date date,
    discount_pt numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    usage_limit integer,
    discount_type character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    discount_value numeric(10,2) DEFAULT 0 NOT NULL,
    max_discount numeric(10,2)
);


ALTER TABLE public.coupon OWNER TO naimulislam;

--
-- Name: courier; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.courier (
    courier_id integer NOT NULL,
    name character varying(120) NOT NULL,
    phone character varying(20),
    coverage_area character varying(150),
    email character varying(150),
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.courier OWNER TO naimulislam;

--
-- Name: courier_courier_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.courier_courier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courier_courier_id_seq OWNER TO naimulislam;

--
-- Name: courier_courier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.courier_courier_id_seq OWNED BY public.courier.courier_id;


--
-- Name: courier_coverage; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.courier_coverage (
    id integer NOT NULL,
    courier_id integer NOT NULL,
    district character varying(80) NOT NULL,
    city character varying(80)
);


ALTER TABLE public.courier_coverage OWNER TO naimulislam;

--
-- Name: courier_coverage_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.courier_coverage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courier_coverage_id_seq OWNER TO naimulislam;

--
-- Name: courier_coverage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.courier_coverage_id_seq OWNED BY public.courier_coverage.id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.customer (
    customer_id integer NOT NULL,
    name character varying(120) NOT NULL,
    phone character varying(20),
    email character varying(150) NOT NULL,
    payment_method character varying(40),
    password_hash character varying(255),
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer OWNER TO naimulislam;

--
-- Name: customer_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.customer_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_customer_id_seq OWNER TO naimulislam;

--
-- Name: customer_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.customer_customer_id_seq OWNED BY public.customer.customer_id;


--
-- Name: customer_order; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.customer_order (
    order_id integer NOT NULL,
    customer_id integer NOT NULL,
    courier_id integer,
    coupon_code character varying(40),
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_address_id integer,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_fee numeric(12,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.customer_order OWNER TO naimulislam;

--
-- Name: customer_order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.customer_order_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_order_order_id_seq OWNER TO naimulislam;

--
-- Name: customer_order_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.customer_order_order_id_seq OWNED BY public.customer_order.order_id;


--
-- Name: customer_payment_method; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.customer_payment_method (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    type character varying(40) NOT NULL,
    provider character varying(80),
    token character varying(255),
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_payment_method OWNER TO naimulislam;

--
-- Name: customer_payment_method_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.customer_payment_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_payment_method_id_seq OWNER TO naimulislam;

--
-- Name: customer_payment_method_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.customer_payment_method_id_seq OWNED BY public.customer_payment_method.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.inventory (
    inventory_id integer NOT NULL,
    warehouse_no integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    record_level integer,
    last_updated timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory OWNER TO naimulislam;

--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_inventory_id_seq OWNER TO naimulislam;

--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.invoice (
    invoice_id integer NOT NULL,
    order_id integer NOT NULL,
    issued_at timestamp without time zone DEFAULT now() NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    status character varying(30) DEFAULT 'issued'::character varying NOT NULL,
    tax_rate numeric(5,2) DEFAULT 5.0
);


ALTER TABLE public.invoice OWNER TO naimulislam;

--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.invoice_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_invoice_id_seq OWNER TO naimulislam;

--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.invoice_invoice_id_seq OWNED BY public.invoice.invoice_id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.media (
    media_no integer NOT NULL,
    variant_code character varying(60) NOT NULL,
    image_url character varying(500),
    video_snippet character varying(500),
    description character varying(300)
);


ALTER TABLE public.media OWNER TO naimulislam;

--
-- Name: media_media_no_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.media_media_no_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_media_no_seq OWNER TO naimulislam;

--
-- Name: media_media_no_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.media_media_no_seq OWNED BY public.media.media_no;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    customer_id integer NOT NULL,
    type character varying(40),
    message character varying(500),
    is_read boolean DEFAULT false NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification OWNER TO naimulislam;

--
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.notification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_notification_id_seq OWNER TO naimulislam;

--
-- Name: notification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.notification_notification_id_seq OWNED BY public.notification.notification_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    customer_id integer NOT NULL,
    type character varying(40),
    message character varying(500),
    sent_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO naimulislam;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO naimulislam;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: order_item; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.order_item (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    code character varying(60)
);


ALTER TABLE public.order_item OWNER TO naimulislam;

--
-- Name: order_item_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.order_item_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_order_item_id_seq OWNER TO naimulislam;

--
-- Name: order_item_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.order_item_order_item_id_seq OWNED BY public.order_item.order_item_id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.payment (
    payment_id integer NOT NULL,
    order_id integer NOT NULL,
    txid character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    method character varying(40) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    paid_at timestamp without time zone
);


ALTER TABLE public.payment OWNER TO naimulislam;

--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.payment_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_payment_id_seq OWNER TO naimulislam;

--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(200) NOT NULL,
    product_code character varying(60) NOT NULL,
    price numeric(12,2) NOT NULL,
    stock_qty integer DEFAULT 0 NOT NULL,
    base_price numeric(12,2),
    category_id integer,
    description text,
    image_url character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product OWNER TO naimulislam;

--
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_product_id_seq OWNER TO naimulislam;

--
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- Name: product_variant; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.product_variant (
    variant_code character varying(60) NOT NULL,
    product_id integer NOT NULL,
    category_id integer,
    color character varying(40),
    sku character varying(60) NOT NULL,
    size character varying(20),
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_variant OWNER TO naimulislam;

--
-- Name: profile; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.profile (
    profile_id integer NOT NULL,
    customer_id integer NOT NULL,
    full_name character varying(150),
    present_address character varying(250),
    gender character varying(20),
    image_url character varying(500),
    date_of_birth date,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profile OWNER TO naimulislam;

--
-- Name: profile_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.profile_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profile_profile_id_seq OWNER TO naimulislam;

--
-- Name: profile_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.profile_profile_id_seq OWNED BY public.profile.profile_id;


--
-- Name: referral; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.referral (
    referral_id integer NOT NULL,
    referrer_customer_id integer NOT NULL,
    code character varying(40) NOT NULL,
    referred_email character varying(150),
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    reward_amount numeric(10,2) DEFAULT 0
);


ALTER TABLE public.referral OWNER TO naimulislam;

--
-- Name: referral_referral_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.referral_referral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_referral_id_seq OWNER TO naimulislam;

--
-- Name: referral_referral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.referral_referral_id_seq OWNED BY public.referral.referral_id;


--
-- Name: refund; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.refund (
    refund_id integer NOT NULL,
    return_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(40),
    processed_at timestamp without time zone
);


ALTER TABLE public.refund OWNER TO naimulislam;

--
-- Name: refund_refund_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.refund_refund_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refund_refund_id_seq OWNER TO naimulislam;

--
-- Name: refund_refund_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.refund_refund_id_seq OWNED BY public.refund.refund_id;


--
-- Name: return_request; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.return_request (
    return_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    requested_time timestamp without time zone DEFAULT now() NOT NULL,
    reason character varying(300),
    status character varying(30) DEFAULT 'requested'::character varying NOT NULL
);


ALTER TABLE public.return_request OWNER TO naimulislam;

--
-- Name: return_request_return_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.return_request_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_request_return_id_seq OWNER TO naimulislam;

--
-- Name: return_request_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.return_request_return_id_seq OWNED BY public.return_request.return_id;


--
-- Name: review; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.review (
    review_id integer NOT NULL,
    product_id integer NOT NULL,
    customer_id integer,
    rating smallint NOT NULL,
    comment character varying(1000),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.review OWNER TO naimulislam;

--
-- Name: review_review_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.review_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_review_id_seq OWNER TO naimulislam;

--
-- Name: review_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.review_review_id_seq OWNED BY public.review.review_id;


--
-- Name: shipment; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.shipment (
    shipment_id integer NOT NULL,
    order_id integer NOT NULL,
    courier_id integer,
    tracking_number character varying(100),
    status character varying(30) DEFAULT 'preparing'::character varying NOT NULL,
    estimated_delivery timestamp without time zone,
    dispatched_at timestamp without time zone,
    delivered_at timestamp without time zone
);


ALTER TABLE public.shipment OWNER TO naimulislam;

--
-- Name: shipment_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.shipment_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipment_shipment_id_seq OWNER TO naimulislam;

--
-- Name: shipment_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.shipment_shipment_id_seq OWNED BY public.shipment.shipment_id;


--
-- Name: support_ticket; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.support_ticket (
    ticket_id integer NOT NULL,
    customer_id integer NOT NULL,
    subject character varying(200) NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_ticket OWNER TO naimulislam;

--
-- Name: support_ticket_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.support_ticket_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_ticket_ticket_id_seq OWNER TO naimulislam;

--
-- Name: support_ticket_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.support_ticket_ticket_id_seq OWNED BY public.support_ticket.ticket_id;


--
-- Name: variant_inventory; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.variant_inventory (
    id integer NOT NULL,
    variant_code character varying(60) NOT NULL,
    warehouse_no integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reorder_level integer,
    last_updated timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.variant_inventory OWNER TO naimulislam;

--
-- Name: variant_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.variant_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.variant_inventory_id_seq OWNER TO naimulislam;

--
-- Name: variant_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.variant_inventory_id_seq OWNED BY public.variant_inventory.id;


--
-- Name: wallet; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.wallet (
    wallet_id integer NOT NULL,
    customer_id integer NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    bank_adress character varying(200),
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wallet OWNER TO naimulislam;

--
-- Name: wallet_wallet_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.wallet_wallet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallet_wallet_id_seq OWNER TO naimulislam;

--
-- Name: wallet_wallet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.wallet_wallet_id_seq OWNED BY public.wallet.wallet_id;


--
-- Name: warehouse; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.warehouse (
    warehouse_no integer NOT NULL,
    name character varying(120) NOT NULL,
    city character varying(80),
    capacity integer
);


ALTER TABLE public.warehouse OWNER TO naimulislam;

--
-- Name: warehouse_warehouse_no_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.warehouse_warehouse_no_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouse_warehouse_no_seq OWNER TO naimulislam;

--
-- Name: warehouse_warehouse_no_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.warehouse_warehouse_no_seq OWNED BY public.warehouse.warehouse_no;


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.wishlist (
    wishlist_id integer NOT NULL,
    customer_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlist OWNER TO naimulislam;

--
-- Name: wishlist_item; Type: TABLE; Schema: public; Owner: naimulislam
--

CREATE TABLE public.wishlist_item (
    id integer NOT NULL,
    wishlist_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_code character varying(60),
    added_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlist_item OWNER TO naimulislam;

--
-- Name: wishlist_item_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.wishlist_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlist_item_id_seq OWNER TO naimulislam;

--
-- Name: wishlist_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.wishlist_item_id_seq OWNED BY public.wishlist_item.id;


--
-- Name: wishlist_wishlist_id_seq; Type: SEQUENCE; Schema: public; Owner: naimulislam
--

CREATE SEQUENCE public.wishlist_wishlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlist_wishlist_id_seq OWNER TO naimulislam;

--
-- Name: wishlist_wishlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: naimulislam
--

ALTER SEQUENCE public.wishlist_wishlist_id_seq OWNED BY public.wishlist.wishlist_id;


--
-- Name: address address_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.address ALTER COLUMN address_id SET DEFAULT nextval('public.address_address_id_seq'::regclass);


--
-- Name: admin admin_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.admin ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_admin_id_seq'::regclass);


--
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- Name: cart cart_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);


--
-- Name: cart_item cart_item_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart_item ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_item_cart_item_id_seq'::regclass);


--
-- Name: category category_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.category ALTER COLUMN category_id SET DEFAULT nextval('public.category_category_id_seq'::regclass);


--
-- Name: courier courier_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier ALTER COLUMN courier_id SET DEFAULT nextval('public.courier_courier_id_seq'::regclass);


--
-- Name: courier_coverage id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier_coverage ALTER COLUMN id SET DEFAULT nextval('public.courier_coverage_id_seq'::regclass);


--
-- Name: customer customer_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_customer_id_seq'::regclass);


--
-- Name: customer_order order_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_order ALTER COLUMN order_id SET DEFAULT nextval('public.customer_order_order_id_seq'::regclass);


--
-- Name: customer_payment_method id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_payment_method ALTER COLUMN id SET DEFAULT nextval('public.customer_payment_method_id_seq'::regclass);


--
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- Name: invoice invoice_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.invoice ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoice_invoice_id_seq'::regclass);


--
-- Name: media media_no; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.media ALTER COLUMN media_no SET DEFAULT nextval('public.media_media_no_seq'::regclass);


--
-- Name: notification notification_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notification ALTER COLUMN notification_id SET DEFAULT nextval('public.notification_notification_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: order_item order_item_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.order_item ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_item_order_item_id_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- Name: profile profile_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.profile ALTER COLUMN profile_id SET DEFAULT nextval('public.profile_profile_id_seq'::regclass);


--
-- Name: referral referral_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.referral ALTER COLUMN referral_id SET DEFAULT nextval('public.referral_referral_id_seq'::regclass);


--
-- Name: refund refund_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.refund ALTER COLUMN refund_id SET DEFAULT nextval('public.refund_refund_id_seq'::regclass);


--
-- Name: return_request return_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.return_request ALTER COLUMN return_id SET DEFAULT nextval('public.return_request_return_id_seq'::regclass);


--
-- Name: review review_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.review ALTER COLUMN review_id SET DEFAULT nextval('public.review_review_id_seq'::regclass);


--
-- Name: shipment shipment_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.shipment ALTER COLUMN shipment_id SET DEFAULT nextval('public.shipment_shipment_id_seq'::regclass);


--
-- Name: support_ticket ticket_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.support_ticket ALTER COLUMN ticket_id SET DEFAULT nextval('public.support_ticket_ticket_id_seq'::regclass);


--
-- Name: variant_inventory id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.variant_inventory ALTER COLUMN id SET DEFAULT nextval('public.variant_inventory_id_seq'::regclass);


--
-- Name: wallet wallet_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wallet ALTER COLUMN wallet_id SET DEFAULT nextval('public.wallet_wallet_id_seq'::regclass);


--
-- Name: warehouse warehouse_no; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.warehouse ALTER COLUMN warehouse_no SET DEFAULT nextval('public.warehouse_warehouse_no_seq'::regclass);


--
-- Name: wishlist wishlist_id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist ALTER COLUMN wishlist_id SET DEFAULT nextval('public.wishlist_wishlist_id_seq'::regclass);


--
-- Name: wishlist_item id; Type: DEFAULT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item ALTER COLUMN id SET DEFAULT nextval('public.wishlist_item_id_seq'::regclass);


--
-- Name: marker marker_pkey; Type: CONSTRAINT; Schema: prisma_contract; Owner: naimulislam
--

ALTER TABLE ONLY prisma_contract.marker
    ADD CONSTRAINT marker_pkey PRIMARY KEY (space);


--
-- Name: address address_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.address
    ADD CONSTRAINT address_pkey PRIMARY KEY (address_id);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (admin_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: cart_item cart_item_cart_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_cart_id_product_id_key UNIQUE (cart_id, product_id);


--
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (cart_item_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);


--
-- Name: coupon coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.coupon
    ADD CONSTRAINT coupon_pkey PRIMARY KEY (code);


--
-- Name: courier_coverage courier_coverage_courier_id_district_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier_coverage
    ADD CONSTRAINT courier_coverage_courier_id_district_key UNIQUE (courier_id, district);


--
-- Name: courier_coverage courier_coverage_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier_coverage
    ADD CONSTRAINT courier_coverage_pkey PRIMARY KEY (id);


--
-- Name: courier courier_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier
    ADD CONSTRAINT courier_pkey PRIMARY KEY (courier_id);


--
-- Name: customer customer_email_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_email_key UNIQUE (email);


--
-- Name: customer_order customer_order_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_order
    ADD CONSTRAINT customer_order_pkey PRIMARY KEY (order_id);


--
-- Name: customer_payment_method customer_payment_method_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_payment_method
    ADD CONSTRAINT customer_payment_method_pkey PRIMARY KEY (id);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: invoice invoice_order_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_order_id_key UNIQUE (order_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (media_no);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (order_item_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: payment payment_txid_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_txid_key UNIQUE (txid);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: product product_product_code_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_product_code_key UNIQUE (product_code);


--
-- Name: product_variant product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (variant_code);


--
-- Name: product_variant product_variant_sku_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_sku_key UNIQUE (sku);


--
-- Name: profile profile_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_customer_id_key UNIQUE (customer_id);


--
-- Name: profile profile_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_pkey PRIMARY KEY (profile_id);


--
-- Name: referral referral_code_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_code_key UNIQUE (code);


--
-- Name: referral referral_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_pkey PRIMARY KEY (referral_id);


--
-- Name: refund refund_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_pkey PRIMARY KEY (refund_id);


--
-- Name: refund refund_return_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_return_id_key UNIQUE (return_id);


--
-- Name: return_request return_request_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.return_request
    ADD CONSTRAINT return_request_pkey PRIMARY KEY (return_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- Name: shipment shipment_order_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_order_id_key UNIQUE (order_id);


--
-- Name: shipment shipment_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_pkey PRIMARY KEY (shipment_id);


--
-- Name: support_ticket support_ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.support_ticket
    ADD CONSTRAINT support_ticket_pkey PRIMARY KEY (ticket_id);


--
-- Name: variant_inventory variant_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.variant_inventory
    ADD CONSTRAINT variant_inventory_pkey PRIMARY KEY (id);


--
-- Name: variant_inventory variant_inventory_variant_code_warehouse_no_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.variant_inventory
    ADD CONSTRAINT variant_inventory_variant_code_warehouse_no_key UNIQUE (variant_code, warehouse_no);


--
-- Name: wallet wallet_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_customer_id_key UNIQUE (customer_id);


--
-- Name: wallet wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_pkey PRIMARY KEY (wallet_id);


--
-- Name: warehouse warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT warehouse_pkey PRIMARY KEY (warehouse_no);


--
-- Name: wishlist wishlist_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_customer_id_key UNIQUE (customer_id);


--
-- Name: wishlist_item wishlist_item_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item
    ADD CONSTRAINT wishlist_item_pkey PRIMARY KEY (id);


--
-- Name: wishlist_item wishlist_item_wishlist_id_variant_code_key; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item
    ADD CONSTRAINT wishlist_item_wishlist_id_variant_code_key UNIQUE (wishlist_id, variant_code);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (wishlist_id);


--
-- Name: idx_address_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_address_customer ON public.address USING btree (customer_id);


--
-- Name: idx_audit_log_record; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_audit_log_record ON public.audit_log USING btree (table_name, record_id);


--
-- Name: idx_cart_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_cart_customer ON public.cart USING btree (customer_id);


--
-- Name: idx_cart_item_cart; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_cart_item_cart ON public.cart_item USING btree (cart_id);


--
-- Name: idx_cart_item_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_cart_item_product ON public.cart_item USING btree (product_id);


--
-- Name: idx_courier_coverage; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_courier_coverage ON public.courier_coverage USING btree (courier_id);


--
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_inventory_product ON public.inventory USING btree (product_id);


--
-- Name: idx_inventory_warehouse; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_inventory_warehouse ON public.inventory USING btree (warehouse_no);


--
-- Name: idx_media_variant; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_media_variant ON public.media USING btree (variant_code);


--
-- Name: idx_notification_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_notification_customer ON public.notification USING btree (customer_id);


--
-- Name: idx_notifications_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_notifications_customer ON public.notifications USING btree (customer_id);


--
-- Name: idx_order_coupon; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_order_coupon ON public.customer_order USING btree (coupon_code);


--
-- Name: idx_order_courier; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_order_courier ON public.customer_order USING btree (courier_id);


--
-- Name: idx_order_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_order_customer ON public.customer_order USING btree (customer_id);


--
-- Name: idx_order_item_order; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_order_item_order ON public.order_item USING btree (order_id);


--
-- Name: idx_order_item_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_order_item_product ON public.order_item USING btree (product_id);


--
-- Name: idx_payment_method_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_payment_method_customer ON public.customer_payment_method USING btree (customer_id);


--
-- Name: idx_payment_order; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_payment_order ON public.payment USING btree (order_id);


--
-- Name: idx_product_category; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_product_category ON public.product USING btree (category_id);


--
-- Name: idx_product_created_at; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_product_created_at ON public.product USING btree (created_at DESC);


--
-- Name: idx_product_is_active; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_product_is_active ON public.product USING btree (is_active);


--
-- Name: idx_product_variant_category; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_product_variant_category ON public.product_variant USING btree (category_id);


--
-- Name: idx_product_variant_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_product_variant_product ON public.product_variant USING btree (product_id);


--
-- Name: idx_referral_referrer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_referral_referrer ON public.referral USING btree (referrer_customer_id);


--
-- Name: idx_return_request_order; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_return_request_order ON public.return_request USING btree (order_id);


--
-- Name: idx_return_request_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_return_request_product ON public.return_request USING btree (product_id);


--
-- Name: idx_review_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_review_customer ON public.review USING btree (customer_id);


--
-- Name: idx_review_product; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_review_product ON public.review USING btree (product_id);


--
-- Name: idx_review_product_rating; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_review_product_rating ON public.review USING btree (product_id, rating);


--
-- Name: idx_shipment_courier; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_shipment_courier ON public.shipment USING btree (courier_id);


--
-- Name: idx_shipment_order; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_shipment_order ON public.shipment USING btree (order_id);


--
-- Name: idx_support_ticket_customer; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_support_ticket_customer ON public.support_ticket USING btree (customer_id);


--
-- Name: idx_variant_inventory_variant; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_variant_inventory_variant ON public.variant_inventory USING btree (variant_code);


--
-- Name: idx_variant_inventory_warehouse; Type: INDEX; Schema: public; Owner: naimulislam
--

CREATE INDEX idx_variant_inventory_warehouse ON public.variant_inventory USING btree (warehouse_no);


--
-- Name: address address_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.address
    ADD CONSTRAINT address_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: cart cart_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: cart_item cart_item_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON DELETE CASCADE;


--
-- Name: cart_item cart_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: category category_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;


--
-- Name: courier_coverage courier_coverage_courier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.courier_coverage
    ADD CONSTRAINT courier_coverage_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.courier(courier_id) ON DELETE CASCADE;


--
-- Name: customer_order customer_order_coupon_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_order
    ADD CONSTRAINT customer_order_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.coupon(code) ON DELETE SET NULL;


--
-- Name: customer_order customer_order_courier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_order
    ADD CONSTRAINT customer_order_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.courier(courier_id) ON DELETE SET NULL;


--
-- Name: customer_order customer_order_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_order
    ADD CONSTRAINT customer_order_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: customer_payment_method customer_payment_method_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.customer_payment_method
    ADD CONSTRAINT customer_payment_method_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_warehouse_no_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_warehouse_no_fkey FOREIGN KEY (warehouse_no) REFERENCES public.warehouse(warehouse_no) ON DELETE CASCADE;


--
-- Name: invoice invoice_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_order(order_id) ON DELETE CASCADE;


--
-- Name: media media_variant_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_variant_code_fkey FOREIGN KEY (variant_code) REFERENCES public.product_variant(variant_code) ON DELETE CASCADE;


--
-- Name: notification notification_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: order_item order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_order(order_id) ON DELETE CASCADE;


--
-- Name: order_item order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE RESTRICT;


--
-- Name: payment payment_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_order(order_id) ON DELETE CASCADE;


--
-- Name: product product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;


--
-- Name: product_variant product_variant_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;


--
-- Name: product_variant product_variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: profile profile_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: referral referral_referrer_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_referrer_customer_id_fkey FOREIGN KEY (referrer_customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: refund refund_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.return_request(return_id) ON DELETE CASCADE;


--
-- Name: return_request return_request_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.return_request
    ADD CONSTRAINT return_request_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_order(order_id) ON DELETE CASCADE;


--
-- Name: return_request return_request_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.return_request
    ADD CONSTRAINT return_request_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE RESTRICT;


--
-- Name: review review_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE SET NULL;


--
-- Name: review review_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: shipment shipment_courier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.courier(courier_id) ON DELETE SET NULL;


--
-- Name: shipment shipment_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_order(order_id) ON DELETE CASCADE;


--
-- Name: support_ticket support_ticket_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.support_ticket
    ADD CONSTRAINT support_ticket_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: variant_inventory variant_inventory_variant_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.variant_inventory
    ADD CONSTRAINT variant_inventory_variant_code_fkey FOREIGN KEY (variant_code) REFERENCES public.product_variant(variant_code) ON DELETE CASCADE;


--
-- Name: variant_inventory variant_inventory_warehouse_no_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.variant_inventory
    ADD CONSTRAINT variant_inventory_warehouse_no_fkey FOREIGN KEY (warehouse_no) REFERENCES public.warehouse(warehouse_no) ON DELETE CASCADE;


--
-- Name: wallet wallet_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: wishlist_item wishlist_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item
    ADD CONSTRAINT wishlist_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: wishlist_item wishlist_item_variant_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item
    ADD CONSTRAINT wishlist_item_variant_code_fkey FOREIGN KEY (variant_code) REFERENCES public.product_variant(variant_code) ON DELETE SET NULL;


--
-- Name: wishlist_item wishlist_item_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: naimulislam
--

ALTER TABLE ONLY public.wishlist_item
    ADD CONSTRAINT wishlist_item_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlist(wishlist_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vjTpvTOrwQUPVbik6APIa4JiB9bkOH9ooCZjwRDhM1DxG0HfRcGPNQ5bLR9DAKX

