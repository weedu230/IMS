-- =============================================================================
-- INVENTORY MANAGEMENT SYSTEM — DATABASE SCHEMA
-- MySQL 8.0 | InnoDB | UTF8MB4
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Drop tables in reverse dependency order (safe re-run)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS stock_transaction;
DROP TABLE IF EXISTS po_item;
DROP TABLE IF EXISTS purchase_order;
DROP TABLE IF EXISTS customer_order_item;
DROP TABLE IF EXISTS customer_order;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS product_supplier;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS supplier;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS warehouse;
DROP TABLE IF EXISTS customer;

-- =============================================================================
-- 1. CATEGORY
-- Self-referencing for hierarchical categories (e.g. Electronics > Laptops)
-- =============================================================================
CREATE TABLE category (
    category_id   INT          NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description   TEXT,
    parent_id     INT          DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (category_id),
    UNIQUE  KEY uq_category_name (category_name),
    FOREIGN KEY (parent_id) REFERENCES category(category_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. WAREHOUSE
-- =============================================================================
CREATE TABLE warehouse (
    warehouse_id   INT          NOT NULL AUTO_INCREMENT,
    warehouse_name VARCHAR(150) NOT NULL,
    location       VARCHAR(255) NOT NULL,
    capacity       INT          NOT NULL DEFAULT 0 COMMENT 'Max units storable',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. EMPLOYEE  (also the system user — holds password_hash)
-- =============================================================================
CREATE TABLE employee (
    emp_id        INT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','manager','staff','viewer') NOT NULL DEFAULT 'staff',
    warehouse_id  INT          DEFAULT NULL COMMENT 'Primary warehouse assignment',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login    TIMESTAMP    NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (emp_id),
    UNIQUE  KEY uq_employee_email (email),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. SUPPLIER
-- =============================================================================
CREATE TABLE supplier (
    supplier_id    INT          NOT NULL AUTO_INCREMENT,
    company_name   VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    email          VARCHAR(150),
    phone          VARCHAR(30),
    address        TEXT,
    lead_time_days INT          NOT NULL DEFAULT 7 COMMENT 'Average delivery days',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (supplier_id),
    UNIQUE KEY uq_supplier_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. PRODUCT
-- =============================================================================
CREATE TABLE product (
    product_id    INT            NOT NULL AUTO_INCREMENT,
    name          VARCHAR(200)   NOT NULL,
    sku           VARCHAR(50)    NOT NULL,
    category_id   INT            DEFAULT NULL,
    unit_price    DECIMAL(10,2)  NOT NULL,
    reorder_level INT            NOT NULL DEFAULT 10,
    reorder_qty   INT            NOT NULL DEFAULT 50,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id),
    UNIQUE  KEY uq_product_sku (sku),
    FOREIGN KEY (category_id) REFERENCES category(category_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_unit_price    CHECK (unit_price    >= 0),
    CONSTRAINT chk_reorder_level CHECK (reorder_level >= 0),
    CONSTRAINT chk_reorder_qty   CHECK (reorder_qty   >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. PRODUCT_SUPPLIER  (M:N bridge — resolves Product ↔ Supplier many-to-many)
-- =============================================================================
CREATE TABLE product_supplier (
    id                INT           NOT NULL AUTO_INCREMENT,
    product_id        INT           NOT NULL,
    supplier_id       INT           NOT NULL,
    supplier_sku      VARCHAR(100)  COMMENT 'Supplier-side part number',
    unit_cost         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_preferred      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE  KEY uq_product_supplier (product_id, supplier_id),
    FOREIGN KEY (product_id)  REFERENCES product(product_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. STOCK  (current on-hand qty per product per warehouse)
-- =============================================================================
CREATE TABLE stock (
    stock_id      INT       NOT NULL AUTO_INCREMENT,
    product_id    INT       NOT NULL,
    warehouse_id  INT       NOT NULL,
    qty_on_hand   INT       NOT NULL DEFAULT 0,
    last_updated  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (stock_id),
    UNIQUE  KEY uq_stock_location (product_id, warehouse_id),
    FOREIGN KEY (product_id)   REFERENCES product(product_id)     ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_qty_on_hand CHECK (qty_on_hand >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. STOCK_TRANSACTION  (immutable ledger — every movement recorded here)
-- =============================================================================
CREATE TABLE stock_transaction (
    txn_id       INT       NOT NULL AUTO_INCREMENT,
    product_id   INT       NOT NULL,
    warehouse_id INT       NOT NULL,
    txn_type     ENUM('IN','OUT','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT','RETURN','WRITE_OFF')
                 NOT NULL,
    quantity     INT       NOT NULL,
    txn_date     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ref_id       INT       DEFAULT NULL COMMENT 'FK to PO or Customer Order depending on txn_type',
    notes        TEXT,
    created_by   INT       DEFAULT NULL COMMENT 'emp_id of actor',

    PRIMARY KEY (txn_id),
    FOREIGN KEY (product_id)   REFERENCES product(product_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)   REFERENCES employee(emp_id)        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_txn_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. CUSTOMER
-- =============================================================================
CREATE TABLE customer (
    customer_id  INT           NOT NULL AUTO_INCREMENT,
    name         VARCHAR(150)  NOT NULL,
    email        VARCHAR(150),
    phone        VARCHAR(30),
    address      TEXT,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (customer_id),
    UNIQUE KEY uq_customer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. CUSTOMER_ORDER
-- =============================================================================
CREATE TABLE customer_order (
    order_id         INT           NOT NULL AUTO_INCREMENT,
    customer_id      INT           NOT NULL,
    order_date       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           ENUM('pending','confirmed','picking','packed','dispatched','fulfilled','cancelled','returned')
                     NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes            TEXT,
    created_by       INT           DEFAULT NULL,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (order_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES employee(emp_id)      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. CUSTOMER_ORDER_ITEM
-- =============================================================================
CREATE TABLE customer_order_item (
    item_id      INT           NOT NULL AUTO_INCREMENT,
    order_id     INT           NOT NULL,
    product_id   INT           NOT NULL,
    warehouse_id INT           NOT NULL COMMENT 'Fulfilling warehouse',
    qty_ordered  INT           NOT NULL,
    qty_reserved INT           NOT NULL DEFAULT 0,
    qty_shipped  INT           NOT NULL DEFAULT 0,
    unit_price   DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (item_id),
    FOREIGN KEY (order_id)     REFERENCES customer_order(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id)   REFERENCES product(product_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)  ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_qty_ordered   CHECK (qty_ordered  > 0),
    CONSTRAINT chk_qty_reserved  CHECK (qty_reserved >= 0),
    CONSTRAINT chk_qty_shipped   CHECK (qty_shipped  >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. PURCHASE_ORDER
-- =============================================================================
CREATE TABLE purchase_order (
    po_id          INT           NOT NULL AUTO_INCREMENT,
    supplier_id    INT           NOT NULL,
    order_date     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_date  DATE          DEFAULT NULL,
    status         ENUM('draft','pending_approval','approved','sent','partially_received','received','cancelled')
                   NOT NULL DEFAULT 'draft',
    total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes          TEXT,
    created_by     INT           DEFAULT NULL,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (po_id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES employee(emp_id)      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. PO_ITEM
-- =============================================================================
CREATE TABLE po_item (
    po_item_id        INT           NOT NULL AUTO_INCREMENT,
    po_id             INT           NOT NULL,
    product_id        INT           NOT NULL,
    warehouse_id      INT           NOT NULL COMMENT 'Receiving warehouse',
    qty_ordered       INT           NOT NULL,
    unit_cost         DECIMAL(10,2) NOT NULL,
    qty_received      INT           NOT NULL DEFAULT 0,

    PRIMARY KEY (po_item_id),
    FOREIGN KEY (po_id)        REFERENCES purchase_order(po_id)    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id)   REFERENCES product(product_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id)  ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_po_qty_ordered  CHECK (qty_ordered  > 0),
    CONSTRAINT chk_po_qty_received CHECK (qty_received >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. AUDIT_LOG  (immutable — records every mutation with before/after values)
-- =============================================================================
CREATE TABLE audit_log (
    log_id     BIGINT       NOT NULL AUTO_INCREMENT,
    table_name VARCHAR(50)  NOT NULL,
    record_id  INT          NOT NULL,
    action     ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    old_values JSON         DEFAULT NULL,
    new_values JSON         DEFAULT NULL,
    changed_by INT          DEFAULT NULL,
    changed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (log_id),
    FOREIGN KEY (changed_by) REFERENCES employee(emp_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INDEXES  (as specified in the report's indexing strategy)
-- =============================================================================
CREATE INDEX idx_product_sku        ON product          (sku);
CREATE INDEX idx_product_category   ON product          (category_id);
CREATE INDEX idx_stock_levels       ON stock            (product_id, warehouse_id);
CREATE INDEX idx_txn_date           ON stock_transaction (txn_date, product_id);
CREATE INDEX idx_txn_type           ON stock_transaction (txn_type);
CREATE INDEX idx_po_status          ON purchase_order   (status, supplier_id);
CREATE INDEX idx_order_status       ON customer_order   (status, customer_id);
CREATE INDEX idx_order_date         ON customer_order   (order_date);
CREATE INDEX idx_audit_table_record ON audit_log        (table_name, record_id);
CREATE INDEX idx_audit_changed_at   ON audit_log        (changed_at);

-- =============================================================================
-- STORED PROCEDURE — RecordStockMovement
-- Implements ACID transaction as specified in the report (Section 3.4.2)
-- =============================================================================
DROP PROCEDURE IF EXISTS RecordStockMovement;

DELIMITER $$

CREATE PROCEDURE RecordStockMovement(
    IN p_product_id   INT,
    IN p_warehouse_id INT,
    IN p_txn_type     VARCHAR(20),
    IN p_quantity     INT,
    IN p_ref_id       INT,
    IN p_notes        TEXT,
    IN p_created_by   INT
)
BEGIN
    DECLARE v_current_qty INT DEFAULT 0;
    DECLARE v_new_qty     INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Get current qty (or 0 if no row)
    SELECT COALESCE(qty_on_hand, 0) INTO v_current_qty
    FROM stock
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

    -- Calculate new quantity
    SET v_new_qty = CASE
        WHEN p_txn_type IN ('IN', 'TRANSFER_IN', 'RETURN')  THEN v_current_qty + p_quantity
        WHEN p_txn_type IN ('OUT','TRANSFER_OUT','WRITE_OFF') THEN v_current_qty - p_quantity
        WHEN p_txn_type = 'ADJUSTMENT'                       THEN p_quantity
        ELSE v_current_qty
    END;

    -- Guard: prevent negative stock
    IF v_new_qty < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock: transaction would result in negative quantity';
    END IF;

    -- Record the transaction first
    INSERT INTO stock_transaction
        (product_id, warehouse_id, txn_type, quantity, ref_id, notes, created_by)
    VALUES
        (p_product_id, p_warehouse_id, p_txn_type, p_quantity, p_ref_id, p_notes, p_created_by);

    -- Upsert stock: INSERT if not exists, UPDATE if exists
    INSERT INTO stock (product_id, warehouse_id, qty_on_hand, last_updated)
    VALUES (p_product_id, p_warehouse_id, v_new_qty, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
        qty_on_hand = v_new_qty,
        last_updated = CURRENT_TIMESTAMP;

    COMMIT;
END$$

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURE — GetLowStockProducts
-- Returns all products at or below their reorder level (used by alert system)
-- =============================================================================
DROP PROCEDURE IF EXISTS GetLowStockProducts;

DELIMITER $$

CREATE PROCEDURE GetLowStockProducts()
BEGIN
    SELECT
        p.product_id,
        p.sku,
        p.name,
        c.category_name,
        SUM(s.qty_on_hand)  AS total_stock,
        p.reorder_level,
        p.reorder_qty,
        (p.reorder_level - SUM(s.qty_on_hand)) AS shortage
    FROM   product p
    LEFT   JOIN category c ON p.category_id  = c.category_id
    LEFT   JOIN stock    s ON p.product_id   = s.product_id
    WHERE  p.is_active = TRUE
    GROUP  BY p.product_id, p.sku, p.name, c.category_name, p.reorder_level, p.reorder_qty
    HAVING total_stock <= p.reorder_level
    ORDER  BY shortage DESC;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- DONE — Schema ready. Run seed.sql next to populate initial data.
-- =============================================================================
