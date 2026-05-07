-- =============================================================================
-- IMS SEED DATA
-- Run AFTER schema.sql
-- Passwords are bcrypt hash of 'Password123!' (cost 12)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
INSERT INTO category (category_id, category_name, description, parent_id) VALUES
(1,  'Electronics',        'Electronic devices and components',          NULL),
(2,  'Laptops',            'Portable computers',                         1),
(3,  'Mobile Phones',      'Smartphones and feature phones',             1),
(4,  'Accessories',        'Cables, cases, and peripherals',             1),
(5,  'Office Supplies',    'Stationery and office consumables',          NULL),
(6,  'Paper & Printing',   'Paper, ink, and toner',                      5),
(7,  'Furniture',          'Desks, chairs, and storage',                 NULL),
(8,  'Industrial',         'Tools and industrial equipment',             NULL),
(9,  'Safety Equipment',   'PPE and safety gear',                        8),
(10, 'Networking',         'Routers, switches, and cables',              1);

-- ─── WAREHOUSES ───────────────────────────────────────────────────────────────
INSERT INTO warehouse (warehouse_id, warehouse_name, location, capacity, is_active) VALUES
(1, 'Main Warehouse',       'Industrial Zone A, Karachi',   50000, TRUE),
(2, 'North Distribution',   'North Hub, Lahore',            30000, TRUE),
(3, 'Cold Storage Annex',   'Zone B, Karachi',              10000, TRUE),
(4, 'Returns Processing',   'Main Campus, Karachi',          5000, TRUE);

-- ─── EMPLOYEES  (password = 'Password123!') ───────────────────────────────────
INSERT INTO employee (emp_id, name, email, password_hash, role, warehouse_id, is_active) VALUES
(1, 'System Admin',      'admin@ims.local',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQh9PKtRTjLy', 'admin',   1, TRUE),
(2, 'Sara Khan',         'sara@ims.local',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQh9PKtRTjLy', 'manager', 1, TRUE),
(3, 'Ali Raza',          'ali@ims.local',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQh9PKtRTjLy', 'staff',   1, TRUE),
(4, 'Fatima Malik',      'fatima@ims.local',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQh9PKtRTjLy', 'staff',   2, TRUE),
(5, 'Omar Sheikh',       'omar@ims.local',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQh9PKtRTjLy', 'viewer',  NULL, TRUE);

-- ─── SUPPLIERS ────────────────────────────────────────────────────────────────
INSERT INTO supplier (supplier_id, company_name, contact_person, email, phone, address, lead_time_days) VALUES
(1, 'TechDistrib Co.',     'Zain Ahmed',    'zain@techdistrib.com',  '+92-21-1234567', 'SITE Area, Karachi',     5),
(2, 'Global Parts Ltd.',   'Nadia Iqbal',   'nadia@globalparts.com', '+92-42-9876543', 'Gulberg, Lahore',        7),
(3, 'OfficeMax Supplies',  'Tariq Hussain', 'tariq@officemax.com',   '+92-21-5556677', 'Clifton, Karachi',       3),
(4, 'Industrial Pro PK',   'Hira Shah',     'hira@industrialpro.pk', '+92-51-3334455', 'Islamabad',             10),
(5, 'Network Solutions',   'Bilal Chaudhry','bilal@netsol.pk',       '+92-21-7778899', 'Korangi, Karachi',       4);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
INSERT INTO product (product_id, name, sku, category_id, unit_price, reorder_level, reorder_qty, is_active) VALUES
(1,  'Dell Laptop 15"',          'DELL-LAP-15',   2,   85000.00,  5,  10, TRUE),
(2,  'HP EliteBook 840',         'HP-ELITE-840',  2,   120000.00, 3,   5, TRUE),
(3,  'Samsung Galaxy S24',       'SAM-S24',        3,   75000.00,  8,  20, TRUE),
(4,  'iPhone 15 Pro',            'APL-IP15P',      3,  180000.00,  5,  10, TRUE),
(5,  'USB-C Cable 2m',           'CBL-USBC-2M',   4,     450.00, 50, 200, TRUE),
(6,  'HDMI Cable 3m',            'CBL-HDMI-3M',   4,     350.00, 50, 200, TRUE),
(7,  'A4 Paper Ream 500',        'PPR-A4-500',    6,     900.00, 30, 100, TRUE),
(8,  'HP Toner 85A',             'TON-HP-85A',    6,    4500.00, 10,  30, TRUE),
(9,  'Ergonomic Chair',          'FURN-CHAIR-ERG',7,   35000.00,  2,   5, TRUE),
(10, 'Standing Desk 180cm',      'FURN-DESK-180', 7,   55000.00,  2,   3, TRUE),
(11, 'Safety Helmet (Class E)',  'SFTY-HELM-CE',  9,    2200.00, 15,  50, TRUE),
(12, 'TP-Link 24-Port Switch',   'NET-TPLINK-24', 10,  28000.00,  3,  10, TRUE),
(13, 'Cisco Catalyst 2960',      'NET-CISCO-2960',10, 145000.00,  2,   4, TRUE),
(14, 'Logitech Wireless Mouse',  'PRPH-LOG-WM',   4,    3500.00, 20,  50, TRUE),
(15, 'Mechanical Keyboard',      'PRPH-MECH-KB',  4,    8500.00, 10,  25, TRUE);

-- ─── PRODUCT_SUPPLIER (M:N) ───────────────────────────────────────────────────
INSERT INTO product_supplier (product_id, supplier_id, supplier_sku, unit_cost, is_preferred) VALUES
(1,  1, 'TD-DELL15',    72000.00, TRUE),
(1,  2, 'GP-DELL15',    73500.00, FALSE),
(2,  1, 'TD-HPELITE',  105000.00, TRUE),
(3,  1, 'TD-SAMS24',    62000.00, TRUE),
(4,  1, 'TD-IP15P',    155000.00, TRUE),
(5,  1, 'TD-USBC2M',      300.00, TRUE),
(5,  3, 'OM-USBC2M',      320.00, FALSE),
(6,  1, 'TD-HDMI3M',      240.00, TRUE),
(7,  3, 'OM-A4PPR',       700.00, TRUE),
(8,  3, 'OM-TON85A',     3800.00, TRUE),
(9,  3, 'OM-ERGCHR',    28000.00, TRUE),
(10, 3, 'OM-STD180',    44000.00, TRUE),
(11, 4, 'IP-HELMCE',     1600.00, TRUE),
(12, 5, 'NS-TPL24',     22000.00, TRUE),
(13, 5, 'NS-CSC2960',  120000.00, TRUE),
(14, 1, 'TD-LOGWM',      2600.00, TRUE),
(15, 1, 'TD-MECHKB',     6500.00, TRUE);

-- ─── STOCK (initial inventory) ────────────────────────────────────────────────
INSERT INTO stock (product_id, warehouse_id, qty_on_hand) VALUES
-- Main Warehouse
(1,  1, 12), (2,  1,  4), (3,  1, 25), (4,  1, 8),
(5,  1, 180),(6,  1, 150),(7,  1, 60), (8,  1, 20),
(9,  1,  6), (10, 1,  3), (11, 1, 40),(12, 1, 10),
(13, 1,  3), (14, 1, 45),(15, 1, 18),
-- North Distribution
(1,  2,  5), (3,  2, 10), (5,  2, 80),(7,  2, 40),
(11, 2, 30),(14, 2, 20),
-- Returns Processing
(5,  4,  8), (6,  4,  5), (14, 4,  3);

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────
INSERT INTO customer (customer_id, name, email, phone, address, credit_limit) VALUES
(1, 'Apex Corp Ltd.',        'orders@apexcorp.pk',    '+92-21-3334455', 'Korangi Industrial, Karachi', 1000000.00),
(2, 'BuildRight Contractors','purchase@buildright.pk','+92-42-6667788', 'DHA, Lahore',                  500000.00),
(3, 'City Hospital Group',   'supply@cityhospital.pk','+92-21-9990011', 'Saddar, Karachi',               750000.00),
(4, 'TechStart Solutions',   'it@techstart.pk',       '+92-51-2223344', 'F-10, Islamabad',              200000.00);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify counts
SELECT 'Categories'    AS table_name, COUNT(*) AS total_rows FROM category
UNION ALL SELECT 'Warehouses',  COUNT(*) FROM warehouse
UNION ALL SELECT 'Employees',   COUNT(*) FROM employee
UNION ALL SELECT 'Suppliers',   COUNT(*) FROM supplier
UNION ALL SELECT 'Products',    COUNT(*) FROM product
UNION ALL SELECT 'Stock rows',  COUNT(*) FROM stock
UNION ALL SELECT 'Customers',   COUNT(*) FROM customer;
