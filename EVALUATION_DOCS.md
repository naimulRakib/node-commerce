# NodeCommerce System Architecture & Evaluation Document
**Project**: NodeCommerce
**Context**: Academic Evaluation / Project Defense

## 1. System Overview
NodeCommerce is a modern e-commerce web application built using **Next.js 16 (App Router)** and **PostgreSQL**. The project implements advanced backend architecture patterns, focusing heavily on robust data modeling, transactional safety, and Role-Based Access Control (RBAC).

## 2. Technology Stack & Paradigms
*   **Frontend**: Next.js App Router, React Server Components (RSC) for optimized initial page loads and SEO.
*   **Backend**: Node.js via Next.js Server Actions and Route Handlers.
*   **Database**: PostgreSQL (Relational Database Management System).
*   **Authentication**: Custom JWT (JSON Web Tokens) with `jose`, stored securely in `HttpOnly` cookies to mitigate Cross-Site Scripting (XSS).
*   **Security**: `bcryptjs` for password hashing, parameterized SQL queries to prevent SQL Injection.
*   **Data Fetching**: Scatter-Gather pattern via `Promise.all` for parallel database queries.

## 3. Database Architecture (Entity-Relationship)
The database follows strict normalization rules to ensure data integrity and avoid redundancy.
*   **Strong Entities**: `customer`, `product`, `category`, `admin`.
*   **Weak Entities**: `profile`, `wallet`, `cart`, `wishlist` (1:1 relationships with `customer`).
*   **Transactional Entities**: `customer_order`, `order_item`, `invoice`, `payment`, `shipment`.

### 3.1 Recent Schema Enhancements
To ensure full system operability, the following migrations were applied:
1.  **Product Normalization**: Added `base_price`, `category_id`, `is_active` to properly support filtering and dynamic pricing.
2.  **Order Financials**: Added `subtotal`, `discount_amount`, `shipping_fee` to `customer_order` to maintain historical financial accuracy.
3.  **Variant Tracking**: Added `variant_code` to `cart_item` to distinguish between sizes and colors of the same product.
4.  **Admin Segregation**: Created a dedicated `admin` table. This is a crucial security best practice to ensure customer and admin credentials reside in separate security domains.

## 4. Key Business Logic Implementations

### 4.1 Transaction Management (ACID Properties)
The checkout process (`src/lib/transactions.ts` -> `placeOrder`) is the most complex part of the system. It uses raw PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) to enforce ACID properties:
*   **Atomicity**: Either all 10 steps (cart clear, order creation, inventory deduction, invoice creation, etc.) succeed, or none do.
*   **Isolation**: `BEGIN ISOLATION LEVEL SERIALIZABLE` is used to prevent "Phantom Reads" and race conditions. This guarantees that if two users try to buy the last stock of a product simultaneously, only one will succeed.
*   **Consistency**: Inventory is strictly checked before deduction. Constraints ensure negative inventory is impossible.

### 4.2 Security & Authentication
*   **Registration Atomicity**: User registration creates the `customer`, `profile`, `cart`, `wallet`, and `wishlist` records in a single database transaction.
*   **Session Management**: Stateless authentication using JWT. Cookies are cleared explicitly on logout.
*   **Role-Based Access Control (RBAC)**: Admin routes are guarded by `requireAdmin()`, and customer routes by `requireCustomer()`.

### 4.3 Audit Logging
An `audit_log` table tracks sensitive operations (e.g., placing an order, cancelling an order, creating a customer). This provides non-repudiation and traceability for system administrators.

## 5. Bilingual Code Comments
Throughout the codebase, extensive **Bengali comments** have been added. This serves a dual purpose:
1.  **Academic Clarity**: Explains complex concepts (like N+1 query problems, Transactions, and SSR) natively for easier comprehension during the evaluation.
2.  **Maintainability**: Helps local developers quickly understand the architectural intent without referring to external documentation.

## 6. How to Run the Demo
1.  Start the database and ensure the migrations (`migrate.sql`) and seed data (`seed.sql`) are applied.
2.  Run the application using `npm run dev`.
3.  **Customer Login**: Register a new user or use the demo flow.
4.  **Admin Login**: `admin@nodecommerce.com` / Password is `Admin@1234` (This was populated via seed.sql)

## 7. Conclusion
The NodeCommerce system successfully demonstrates the integration of a modern React frontend with a robust, transactionally-safe SQL backend. The implementation explicitly handles edge cases such as race conditions and data anomalies, making it a production-ready blueprint.
