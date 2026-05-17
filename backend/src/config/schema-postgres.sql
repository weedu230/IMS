-- =============================================================================
-- INVENTORY MANAGEMENT SYSTEM — DATABASE SCHEMA (PostgreSQL 13+)
-- Converted from MySQL for Supabase compatibility
-- =============================================================================

-- Drop tables in reverse dependency order (safe re-run)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS stock_transaction CASCADE;
DROP TABLE IF EXISTS po_item CASCADE;
DROP TABLE IF EXISTS purchase_order CASCADE;
DROP TABLE IF EXISTS customer_order_item CASCADE;
DROP TABLE IF EXISTS customer_order CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS product_supplier CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS employee CASCADE;
DROP TABLE IF EXISTS warehouse CASCADE;
DROP TABLE IF EXISTS customer CASCADE;

-- Drop enum types if they exist
DROP TYPE IF EXISTS txn_type_enum CASCADE;
DROP TYPE IF EXISTS employee_role_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS po_status_enum CASCADE;
DROP TYPE IF EXISTS audit_action_enum CASCADE;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================
CREATE TYPE employee_role_enum AS ENUM ('admin', 'manager', 'staff', 'viewer');
CREATE TYPE po_status_enum AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled');
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'picking', 'packed', 'dispatched', 'fulfilled', 'cancelled', 'returned');
CREATE TYPE txn_type_enum AS ENUM ('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF');
CREATE TYPE audit_action_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- =============================================================================
-- 1. CATEGORY
-- Self-referencing for hierarchical categories (e.g. Electronics > Laptops)
-- =============================================================================
CREATE TABLE category (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    parent_id     INTEGER DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (parent_id) REFERENCES category(category_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- 2. WAREHOUSE
-- =============================================================================
CREATE TABLE warehouse (
    warehouse_id   SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(150) NOT NULL,
    location       VARCHAR(255) NOT NULL,
    capacity       INTEGER DEFAULT 0 NOT NULL, -- Max units storable
    is_active      BOOLEAN DEFAULT TRUE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- 3. EMPLOYEE (also the system user — holds password_hash)
-- =============================================================================
CREATE TABLE employee (
    emp_id        SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          employee_role_enum DEFAULT 'staff' NOT NULL,
    warehouse_id  INTEGER DEFAULT NULL, -- Primary warehouse assignment
    is_active     BOOLEAN DEFAULT TRUE NOT NULL,
    last_login    TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- 4. SUPPLIER
-- =============================================================================
CREATE TABLE supplier (
    supplier_id    SERIAL PRIMARY KEY,
    company_name   VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    email          VARCHAR(150) UNIQUE,
    phone          VARCHAR(30),
    address        TEXT,
    lead_time_days INTEGER DEFAULT 7 NOT NULL, -- Average delivery days
    is_active      BOOLEAN DEFAULT TRUE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- 5. PRODUCT
-- =============================================================================
CREATE TABLE product (
    product_id    SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    sku           VARCHAR(50) NOT NULL UNIQUE,
    category_id   INTEGER DEFAULT NULL,
    unit_price    NUMERIC(10, 2) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    reorder_qty   INTEGER NOT NULL DEFAULT 50,
    is_active     BOOLEAN DEFAULT TRUE NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_unit_price    CHECK (unit_price >= 0),
    CONSTRAINT chk_reorder_level CHECK (reorder_level >= 0),
    CONSTRAINT chk_reorder_qty   CHECK (reorder_qty >= 0)
);

-- =============================================================================
-- 6. PRODUCT_SUPPLIER (M:N bridge)
-- =============================================================================
CREATE TABLE product_supplier (
    id                SERIAL PRIMARY KEY,
    product_id        INTEGER NOT NULL,
    supplier_id       INTEGER NOT NULL,
    supplier_sku      VARCHAR(100), -- Supplier-side part number
    unit_cost         NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    is_preferred      BOOLEAN DEFAULT FALSE NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (product_id, supplier_id),
    FOREIGN KEY (product_id)  REFERENCES product(product_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================================================
-- 7. STOCK (current on-hand qty per product per warehouse)
-- =============================================================================
CREATE TABLE stock (
    stock_id      SERIAL PRIMARY KEY,
    product_id    INTEGER NOT NULL,
    warehouse_id  INTEGER NOT NULL,
    bin_location  VARCHAR(100) DEFAULT 'MAIN' NOT NULL, -- Shelf/bin code
    qty_on_hand   INTEGER DEFAULT 0 NOT NULL,
    last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (product_id, warehouse_id, bin_location),
    FOREIGN KEY (product_id)   REFERENCES product(product_id)   ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_qty_on_hand CHECK (qty_on_hand >= 0)
);

-- =============================================================================
-- 8. STOCK_TRANSACTION (immutable ledger)
-- =============================================================================
CREATE TABLE stock_transaction (
    txn_id       SERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    bin_location VARCHAR(100) DEFAULT 'MAIN' NOT NULL,
    txn_type     txn_type_enum NOT NULL,
    quantity     INTEGER NOT NULL,
    txn_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ref_id       INTEGER DEFAULT NULL, -- FK to PO or Customer Order
    notes        TEXT,
    created_by   INTEGER DEFAULT NULL, -- emp_id of actor
    batch_no     VARCHAR(100) DEFAULT NULL, -- Optional batch/lot
    serial_no    VARCHAR(100) DEFAULT NULL, -- Optional serial

    FOREIGN KEY (product_id)   REFERENCES product(product_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)   REFERENCES employee(emp_id)      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_txn_quantity CHECK (quantity > 0)
);

-- =============================================================================
-- 9. CUSTOMER
-- =============================================================================
CREATE TABLE customer (
    customer_id  SERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    email        VARCHAR(150) UNIQUE,
    phone        VARCHAR(30),
    address      TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- 10. CUSTOMER_ORDER
-- =============================================================================
CREATE TABLE customer_order (
    order_id         SERIAL PRIMARY KEY,
    customer_id      INTEGER NOT NULL,
    order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status           order_status_enum DEFAULT 'pending' NOT NULL,
    shipping_address TEXT,
    total_amount     NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    notes            TEXT,
    created_by       INTEGER DEFAULT NULL,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES employee(emp_id)     ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- 11. CUSTOMER_ORDER_ITEM
-- =============================================================================
CREATE TABLE customer_order_item (
    item_id      SERIAL PRIMARY KEY,
    order_id     INTEGER NOT NULL,
    product_id   INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL, -- Fulfilling warehouse
    qty_ordered  INTEGER NOT NULL,
    qty_reserved INTEGER DEFAULT 0 NOT NULL,
    qty_shipped  INTEGER DEFAULT 0 NOT NULL,
    unit_price   NUMERIC(10, 2) NOT NULL,

    FOREIGN KEY (order_id)     REFERENCES customer_order(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id)   REFERENCES product(product_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_qty_ordered   CHECK (qty_ordered > 0),
    CONSTRAINT chk_qty_reserved  CHECK (qty_reserved >= 0),
    CONSTRAINT chk_qty_shipped   CHECK (qty_shipped >= 0)
);

-- =============================================================================
-- 12. PURCHASE_ORDER
-- =============================================================================
CREATE TABLE purchase_order (
    po_id          SERIAL PRIMARY KEY,
    supplier_id    INTEGER NOT NULL,
    order_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_date  DATE DEFAULT NULL,
    status         po_status_enum DEFAULT 'draft' NOT NULL,
    total_amount   NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    notes          TEXT,
    created_by     INTEGER DEFAULT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES employee(emp_id)     ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- 13. PO_ITEM
-- =============================================================================
CREATE TABLE po_item (
    po_item_id        SERIAL PRIMARY KEY,
    po_id             INTEGER NOT NULL,
    product_id        INTEGER NOT NULL,
    warehouse_id      INTEGER NOT NULL, -- Receiving warehouse
    qty_ordered       INTEGER NOT NULL,
    unit_cost         NUMERIC(10, 2) NOT NULL,
    qty_received      INTEGER DEFAULT 0 NOT NULL,

    FOREIGN KEY (po_id)        REFERENCES purchase_order(po_id)    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id)   REFERENCES product(product_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_po_qty_ordered  CHECK (qty_ordered > 0),
    CONSTRAINT chk_po_qty_received CHECK (qty_received >= 0)
);

-- =============================================================================
-- 14. AUDIT_LOG (immutable)
-- =============================================================================
CREATE TABLE audit_log (
    log_id     BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id  INTEGER NOT NULL,
    action     audit_action_enum NOT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    changed_by INTEGER DEFAULT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (changed_by) REFERENCES employee(emp_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_product_sku        ON product(sku);
CREATE INDEX idx_product_category   ON product(category_id);
CREATE INDEX idx_stock_levels       ON stock(product_id, warehouse_id);
CREATE INDEX idx_txn_date           ON stock_transaction(txn_date, product_id);
CREATE INDEX idx_txn_type           ON stock_transaction(txn_type);
CREATE INDEX idx_po_status          ON purchase_order(status, supplier_id);
CREATE INDEX idx_order_status       ON customer_order(status, customer_id);
CREATE INDEX idx_order_date         ON customer_order(order_date);
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at   ON audit_log(changed_at);

-- =============================================================================
-- FUNCTION: RecordStockMovement
-- Implements ACID transaction (PostgreSQL stored function version)
-- =============================================================================
DROP FUNCTION IF EXISTS record_stock_movement(INT, INT, VARCHAR, INT, INT, TEXT, INT, VARCHAR, VARCHAR, VARCHAR);

CREATE FUNCTION record_stock_movement(
    p_product_id   INT,
    p_warehouse_id INT,
    p_txn_type     VARCHAR,
    p_quantity     INT,
    p_ref_id       INT DEFAULT NULL,
    p_notes        TEXT DEFAULT NULL,
    p_created_by   INT DEFAULT NULL,
    p_bin_location VARCHAR DEFAULT 'MAIN',
    p_batch_no     VARCHAR DEFAULT NULL,
    p_serial_no    VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message VARCHAR) AS $$
DECLARE
    v_current_qty INT := 0;
    v_new_qty     INT := 0;
    v_bin_location VARCHAR := COALESCE(NULLIF(p_bin_location, ''), 'MAIN');
    v_txn_type_enum txn_type_enum;
BEGIN
    BEGIN
        -- Cast string to enum
        v_txn_type_enum := p_txn_type::txn_type_enum;

        -- Get current qty (or 0 if no row exists)
        SELECT COALESCE(qty_on_hand, 0) INTO v_current_qty
        FROM stock
        WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id AND bin_location = v_bin_location;

        -- Calculate new quantity based on transaction type
        v_new_qty := CASE
            WHEN v_txn_type_enum IN ('IN', 'TRANSFER_IN', 'RETURN')  THEN v_current_qty + p_quantity
            WHEN v_txn_type_enum IN ('OUT', 'TRANSFER_OUT', 'WRITE_OFF') THEN v_current_qty - p_quantity
            WHEN v_txn_type_enum = 'ADJUSTMENT'                      THEN p_quantity
            ELSE v_current_qty
        END;

        -- Guard: prevent negative stock
        IF v_new_qty < 0 THEN
            RETURN QUERY SELECT FALSE, 'Insufficient stock: transaction would result in negative quantity'::VARCHAR;
            RETURN;
        END IF;

        -- Record the transaction (immutable ledger)
        INSERT INTO stock_transaction
            (product_id, warehouse_id, bin_location, txn_type, quantity, ref_id, notes, created_by, batch_no, serial_no)
        VALUES
            (p_product_id, p_warehouse_id, v_bin_location, v_txn_type_enum, p_quantity, p_ref_id, p_notes, p_created_by, p_batch_no, p_serial_no);

        -- Upsert stock: INSERT if not exists, UPDATE if exists
        INSERT INTO stock (product_id, warehouse_id, bin_location, qty_on_hand, last_updated)
        VALUES (p_product_id, p_warehouse_id, v_bin_location, v_new_qty, CURRENT_TIMESTAMP)
        ON CONFLICT (product_id, warehouse_id, bin_location)
        DO UPDATE SET qty_on_hand = v_new_qty, last_updated = CURRENT_TIMESTAMP;

        RETURN QUERY SELECT TRUE, 'Stock transaction recorded successfully'::VARCHAR;

    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, ('Error: ' || SQLERRM)::VARCHAR;
    END;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: GetLowStockProducts
-- Returns all products at or below their reorder level
-- =============================================================================
DROP FUNCTION IF EXISTS get_low_stock_products();

CREATE FUNCTION get_low_stock_products()
RETURNS TABLE(
    product_id INT,
    sku VARCHAR,
    name VARCHAR,
    category_name VARCHAR,
    total_stock BIGINT,
    reorder_level INT,
    reorder_qty INT,
    shortage BIGINT
) AS $$
SELECT
    p.product_id,
    p.sku,
    p.name,
    c.category_name,
    COALESCE(SUM(s.qty_on_hand), 0)  AS total_stock,
    p.reorder_level,
    p.reorder_qty,
    (p.reorder_level - COALESCE(SUM(s.qty_on_hand), 0)) AS shortage
FROM   product p
LEFT   JOIN category c ON p.category_id  = c.category_id
LEFT   JOIN stock    s ON p.product_id   = s.product_id
WHERE  p.is_active = TRUE
GROUP  BY p.product_id, p.sku, p.name, c.category_name, p.reorder_level, p.reorder_qty
HAVING COALESCE(SUM(s.qty_on_hand), 0) <= p.reorder_level
ORDER  BY shortage DESC;
$$ LANGUAGE SQL;

-- =============================================================================
-- DONE — PostgreSQL schema ready. Run this once, then run seed-postgres.sql
-- =============================================================================
