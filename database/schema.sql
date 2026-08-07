-- ============================================================
-- CPS Integrated Contractor, Import and Export Management System
-- MySQL 8.0+ Database Schema
-- Course: CSE471 System Analysis and Design
-- ============================================================

CREATE DATABASE IF NOT EXISTS cps_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cps_management;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_inventory_status;
DROP VIEW IF EXISTS vw_invoice_balance;
DROP VIEW IF EXISTS vw_project_summary;

DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS price_alerts;
DROP TABLE IF EXISTS product_recommendations;
DROP TABLE IF EXISTS boq_items;
DROP TABLE IF EXISTS boq_estimates;
DROP TABLE IF EXISTS material_prices;
DROP TABLE IF EXISTS import_costs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. Authentication and Role-Based Access Control
-- ------------------------------------------------------------
CREATE TABLE roles (
    role_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    permission_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id TINYINT UNSIGNED NOT NULL,
    permission_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id TINYINT UNSIGNED NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role_id),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Master Data Management
-- ------------------------------------------------------------
CREATE TABLE clients (
    client_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    client_type ENUM('Corporate','Contractor','Individual','Government') NOT NULL,
    address VARCHAR(255) NOT NULL,
    status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    note VARCHAR(500) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_client_phone (phone),
    UNIQUE KEY uq_client_email (email),
    UNIQUE KEY uq_client_company (company_name),
    INDEX idx_clients_type_status (client_type, status),
    CONSTRAINT fk_clients_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE suppliers (
    supplier_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    country VARCHAR(80) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    is_verified_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_supplier_name (supplier_name),
    UNIQUE KEY uq_supplier_phone (phone),
    UNIQUE KEY uq_supplier_email (email),
    INDEX idx_suppliers_category_status (product_category, status),
    CONSTRAINT fk_suppliers_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE projects (
    project_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(160) NOT NULL,
    client_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    budget DECIMAL(16,2) NOT NULL DEFAULT 0,
    assigned_user_id INT UNSIGNED NULL,
    status ENUM('Planned','Ongoing','Delayed','Completed','Cancelled') NOT NULL DEFAULT 'Planned',
    description TEXT NULL,
    location_name VARCHAR(255) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_projects_client (client_id),
    INDEX idx_projects_status_deadline (status, deadline),
    CONSTRAINT chk_project_dates CHECK (deadline >= start_date),
    CONSTRAINT chk_project_budget CHECK (budget >= 0),
    CONSTRAINT fk_projects_client
        FOREIGN KEY (client_id) REFERENCES clients(client_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_projects_assigned_user
        FOREIGN KEY (assigned_user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. Tender and Quotation Management
-- ------------------------------------------------------------
CREATE TABLE quotations (
    quotation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quotation_no VARCHAR(30) NOT NULL UNIQUE,
    client_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED NULL,
    quotation_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status ENUM('Draft','Submitted','Approved','Rejected','Revised') NOT NULL DEFAULT 'Draft',
    revision_of_id INT UNSIGNED NULL,
    subtotal DECIMAL(16,2) NOT NULL DEFAULT 0,
    vat_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    vat_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(16,2) NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    approved_by INT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quotations_client (client_id),
    INDEX idx_quotations_project (project_id),
    INDEX idx_quotations_status_date (status, quotation_date),
    CONSTRAINT chk_quotation_validity CHECK (valid_until >= quotation_date),
    CONSTRAINT chk_quotation_amounts CHECK (
        subtotal >= 0 AND vat_amount >= 0 AND discount_amount >= 0 AND grand_total >= 0
    ),
    CONSTRAINT fk_quotations_client
        FOREIGN KEY (client_id) REFERENCES clients(client_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_quotations_project
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_quotations_revision
        FOREIGN KEY (revision_of_id) REFERENCES quotations(quotation_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_quotations_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_quotations_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE quotation_items (
    quotation_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    quantity DECIMAL(14,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    line_total DECIMAL(16,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_quotation_items_quotation (quotation_id),
    CONSTRAINT chk_quotation_item_values CHECK (quantity > 0 AND unit_price >= 0),
    CONSTRAINT fk_quotation_items_quotation
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. Purchase Order Management
-- ------------------------------------------------------------
CREATE TABLE purchase_orders (
    purchase_order_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(30) NOT NULL UNIQUE,
    supplier_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED NULL,
    po_date DATE NOT NULL,
    required_delivery_date DATE NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    approval_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    receiving_status ENUM('Not Received','Partially Received','Received') NOT NULL DEFAULT 'Not Received',
    total_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    approved_by INT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_orders_supplier (supplier_id),
    INDEX idx_purchase_orders_project (project_id),
    INDEX idx_purchase_orders_status (approval_status, receiving_status),
    CONSTRAINT chk_po_dates CHECK (required_delivery_date >= po_date),
    CONSTRAINT chk_po_total CHECK (total_amount >= 0),
    CONSTRAINT chk_po_receive_after_approval CHECK (
        receiving_status = 'Not Received' OR approval_status = 'Approved'
    ),
    CONSTRAINT fk_purchase_orders_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_orders_project
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_purchase_orders_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_purchase_orders_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
    purchase_order_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    quantity DECIMAL(14,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    received_quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(16,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_po_items_po (purchase_order_id),
    CONSTRAINT chk_po_item_values CHECK (
        quantity > 0 AND unit_price >= 0 AND received_quantity >= 0 AND received_quantity <= quantity
    ),
    CONSTRAINT fk_po_items_po
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. Import / Export Shipment Tracking
-- ------------------------------------------------------------
CREATE TABLE shipments (
    shipment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shipment_code VARCHAR(30) NOT NULL UNIQUE,
    shipment_type ENUM('Import','Export') NOT NULL,
    supplier_id INT UNSIGNED NULL,
    country VARCHAR(80) NOT NULL,
    port VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(60) NULL,
    lc_number VARCHAR(60) NULL,
    shipment_date DATE NOT NULL,
    expected_arrival_date DATE NOT NULL,
    customs_status ENUM('Pending','In Process','Cleared','Held') NOT NULL DEFAULT 'Pending',
    delivery_status ENUM('Pending','In Transit','Delayed','Partially Received','Delivered') NOT NULL DEFAULT 'Pending',
    remarks VARCHAR(500) NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shipments_supplier (supplier_id),
    INDEX idx_shipments_status (customs_status, delivery_status),
    CONSTRAINT chk_shipment_dates CHECK (expected_arrival_date >= shipment_date),
    CONSTRAINT fk_shipments_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_shipments_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. Inventory and Stock Movement
-- ------------------------------------------------------------
CREATE TABLE inventory_items (
    inventory_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(40) NOT NULL UNIQUE,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    reorder_level DECIMAL(14,2) NOT NULL DEFAULT 0,
    quantity_on_hand DECIMAL(14,2) NOT NULL DEFAULT 0,
    avg_unit_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
    supplier_id INT UNSIGNED NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inventory_supplier (supplier_id),
    INDEX idx_inventory_category (category),
    CONSTRAINT chk_inventory_nonnegative CHECK (
        reorder_level >= 0 AND quantity_on_hand >= 0 AND avg_unit_cost >= 0
    ),
    CONSTRAINT fk_inventory_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
    stock_movement_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT UNSIGNED NOT NULL,
    movement_type ENUM('IN','OUT','DAMAGED','RETURNED','ADJUSTMENT') NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    unit_cost DECIMAL(14,2) NULL,
    reference_type VARCHAR(40) NULL,
    reference_id INT UNSIGNED NULL,
    movement_date DATETIME NOT NULL,
    note VARCHAR(255) NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stock_movement_item_date (inventory_item_id, movement_date),
    INDEX idx_stock_movement_type (movement_type),
    CONSTRAINT chk_stock_movement_quantity CHECK (quantity > 0),
    CONSTRAINT fk_stock_movement_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(inventory_item_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_stock_movement_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. Invoice, Payment and Finance
-- ------------------------------------------------------------
CREATE TABLE invoices (
    invoice_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL UNIQUE,
    quotation_id INT UNSIGNED NULL,
    client_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(16,2) NOT NULL,
    tax_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(16,2) NOT NULL,
    amount_paid DECIMAL(16,2) NOT NULL DEFAULT 0,
    payment_status ENUM('Unpaid','Partially Paid','Paid','Overdue') NOT NULL DEFAULT 'Unpaid',
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoices_client (client_id),
    INDEX idx_invoices_project (project_id),
    INDEX idx_invoices_status_due (payment_status, due_date),
    CONSTRAINT chk_invoice_dates CHECK (due_date >= invoice_date),
    CONSTRAINT chk_invoice_amounts CHECK (
        subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND
        grand_total >= 0 AND amount_paid >= 0 AND amount_paid <= grand_total
    ),
    CONSTRAINT fk_invoices_quotation
        FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_invoices_client
        FOREIGN KEY (client_id) REFERENCES clients(client_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_project
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_invoices_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(16,2) NOT NULL,
    payment_method ENUM('Cash','Bank Transfer','Cheque','Mobile Banking','Card') NOT NULL,
    transaction_ref VARCHAR(100) NULL,
    received_by INT UNSIGNED NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_date (payment_date),
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payments_received_by
        FOREIGN KEY (received_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE import_costs (
    import_cost_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT UNSIGNED NOT NULL UNIQUE,
    currency_code CHAR(3) NOT NULL,
    exchange_rate_to_bdt DECIMAL(14,6) NOT NULL,
    product_cost_foreign DECIMAL(16,2) NOT NULL,
    product_cost_bdt DECIMAL(16,2) NOT NULL,
    shipping_cost_bdt DECIMAL(16,2) NOT NULL DEFAULT 0,
    customs_duty_bdt DECIMAL(16,2) NOT NULL DEFAULT 0,
    tax_vat_bdt DECIMAL(16,2) NOT NULL DEFAULT 0,
    other_charges_bdt DECIMAL(16,2) NOT NULL DEFAULT 0,
    total_import_cost_bdt DECIMAL(16,2) NOT NULL,
    expected_selling_value_bdt DECIMAL(16,2) NOT NULL,
    estimated_profit_loss_bdt DECIMAL(16,2) NOT NULL,
    calculated_by INT UNSIGNED NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_import_cost_values CHECK (
        exchange_rate_to_bdt > 0 AND product_cost_foreign >= 0 AND product_cost_bdt >= 0 AND
        shipping_cost_bdt >= 0 AND customs_duty_bdt >= 0 AND tax_vat_bdt >= 0 AND
        other_charges_bdt >= 0 AND total_import_cost_bdt >= 0
    ),
    CONSTRAINT fk_import_cost_shipment
        FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_import_cost_calculated_by
        FOREIGN KEY (calculated_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. Smart Construction Cost Estimation
-- ------------------------------------------------------------
CREATE TABLE material_prices (
    material_price_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL,
    brand VARCHAR(120) NULL,
    unit VARCHAR(30) NOT NULL,
    price_bdt DECIMAL(14,2) NOT NULL,
    source_name VARCHAR(120) NOT NULL,
    source_url VARCHAR(500) NULL,
    price_date DATE NOT NULL,
    verification_status ENUM('Pending','Verified','Flagged') NOT NULL DEFAULT 'Pending',
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_material_prices_item_date (material_name, price_date),
    INDEX idx_material_prices_verification (verification_status),
    CONSTRAINT chk_material_price CHECK (price_bdt > 0)
) ENGINE=InnoDB;

CREATE TABLE boq_estimates (
    estimate_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    estimate_no VARCHAR(30) NOT NULL UNIQUE,
    client_id INT UNSIGNED NULL,
    project_type VARCHAR(100) NOT NULL,
    area_sqft DECIMAL(14,2) NOT NULL,
    floors SMALLINT UNSIGNED NOT NULL,
    material_quality ENUM('Low','Standard','Premium') NOT NULL,
    labour_category ENUM('Basic','Standard','Skilled') NOT NULL,
    estimated_low DECIMAL(16,2) NOT NULL,
    estimated_standard DECIMAL(16,2) NOT NULL,
    estimated_premium DECIMAL(16,2) NOT NULL,
    status ENUM('Draft','Submitted','Approved') NOT NULL DEFAULT 'Draft',
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_boq_values CHECK (
        area_sqft > 0 AND floors > 0 AND estimated_low >= 0 AND
        estimated_standard >= estimated_low AND estimated_premium >= estimated_standard
    ),
    CONSTRAINT fk_boq_client
        FOREIGN KEY (client_id) REFERENCES clients(client_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_boq_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE boq_items (
    boq_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT UNSIGNED NOT NULL,
    item_type ENUM('Material','Labour') NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_rate DECIMAL(14,2) NOT NULL,
    total_cost DECIMAL(16,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    INDEX idx_boq_items_estimate (estimate_id),
    CONSTRAINT chk_boq_item_values CHECK (quantity > 0 AND unit_rate >= 0),
    CONSTRAINT fk_boq_items_estimate
        FOREIGN KEY (estimate_id) REFERENCES boq_estimates(estimate_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_recommendations (
    recommendation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT UNSIGNED NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    brand VARCHAR(120) NULL,
    supplier_id INT UNSIGNED NULL,
    quality_category ENUM('Low','Standard','Premium') NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    recommended_qty DECIMAL(14,2) NOT NULL,
    projected_cost DECIMAL(16,2) NOT NULL,
    within_budget BOOLEAN NOT NULL DEFAULT TRUE,
    reason VARCHAR(255) NULL,
    INDEX idx_recommendations_estimate (estimate_id),
    CONSTRAINT chk_recommendation_values CHECK (
        unit_price >= 0 AND recommended_qty > 0 AND projected_cost >= 0
    ),
    CONSTRAINT fk_recommendations_estimate
        FOREIGN KEY (estimate_id) REFERENCES boq_estimates(estimate_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE price_alerts (
    price_alert_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    brand VARCHAR(120) NULL,
    target_price DECIMAL(14,2) NOT NULL,
    current_price DECIMAL(14,2) NULL,
    alert_status ENUM('Active','Triggered','Closed') NOT NULL DEFAULT 'Active',
    last_checked_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_alert_values CHECK (
        target_price > 0 AND (current_price IS NULL OR current_price > 0)
    ),
    CONSTRAINT fk_price_alert_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. Email Notification Logging
-- ------------------------------------------------------------
CREATE TABLE email_logs (
    email_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(150) NOT NULL,
    email_type ENUM('Quotation Submission','Invoice Generation','Payment Reminder','Price Alert','Other') NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT UNSIGNED NULL,
    subject VARCHAR(200) NOT NULL,
    send_status ENUM('Sent','Failed','Pending') NOT NULL DEFAULT 'Pending',
    error_message VARCHAR(500) NULL,
    sent_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_logs_status (send_status),
    INDEX idx_email_logs_recipient (recipient_email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Useful Reporting Views
-- ------------------------------------------------------------
CREATE VIEW vw_project_summary AS
SELECT
    p.project_id,
    p.project_name,
    c.company_name AS client_name,
    p.start_date,
    p.deadline,
    p.budget,
    p.status,
    u.full_name AS assigned_to
FROM projects p
JOIN clients c ON c.client_id = p.client_id
LEFT JOIN users u ON u.user_id = p.assigned_user_id;

CREATE VIEW vw_invoice_balance AS
SELECT
    i.invoice_id,
    i.invoice_no,
    c.company_name AS client_name,
    i.invoice_date,
    i.due_date,
    i.grand_total,
    i.amount_paid,
    (i.grand_total - i.amount_paid) AS balance_due,
    i.payment_status
FROM invoices i
JOIN clients c ON c.client_id = i.client_id;

CREATE VIEW vw_inventory_status AS
SELECT
    inventory_item_id,
    sku,
    item_name,
    category,
    unit,
    quantity_on_hand,
    reorder_level,
    CASE
        WHEN quantity_on_hand <= reorder_level THEN 'LOW STOCK'
        ELSE 'OK'
    END AS stock_status
FROM inventory_items;
