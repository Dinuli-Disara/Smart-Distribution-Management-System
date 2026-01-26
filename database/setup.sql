-- Manjula Marketing Distribution Management System
-- Corrected Database Schema

-- Drop database if exists (CAREFUL IN PRODUCTION!)
DROP DATABASE IF EXISTS manjula_marketing;

-- Create database with proper character set
CREATE DATABASE manjula_marketing 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE manjula_marketing;

-- 1. EMPLOYEE (Owner, Clerk, Sales Rep)
CREATE TABLE Employee (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact VARCHAR(15),
    role ENUM('Owner', 'Clerk', 'Sales Representative') NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires DATETIME NULL,
    INDEX idx_employee_role (role)
);

-- 2. Insert first employee with NULL for created_by
-- INSERT INTO Employee (name, email, role, username, password, created_by, updated_by) 
-- VALUES ('System Admin', 'admin@company.com', 'Owner', 'admin', 'hashed_password', NULL, NULL);

-- 3. Update to self-reference
-- UPDATE Employee SET created_by = 1, updated_by = 1 WHERE employee_id = 1;

-- 4. Now add the foreign key constraints
-- ALTER TABLE Employee
-- ADD FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
-- ADD FOREIGN KEY (updated_by) REFERENCES Employee(employee_id);

-- 5. Change to NOT NULL after data exists
-- ALTER TABLE Employee 
-- MODIFY COLUMN created_by INT NOT NULL,
-- MODIFY COLUMN updated_by INT NOT NULL;


-- 6. DELIVERY AREA
CREATE TABLE Delivery_Area (
    area_id INT PRIMARY KEY AUTO_INCREMENT,
    area_name VARCHAR(100) NOT NULL,
    number_of_routes INT DEFAULT 1
);

-- 7. DELIVERY ROUTE
CREATE TABLE Delivery_Route (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    area_id INT NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (area_id) REFERENCES Delivery_Area(area_id)
);

-- 8. VAN
CREATE TABLE Van (
    van_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    assigned_employee_id INT,
    area_id INT,
    FOREIGN KEY (assigned_employee_id) REFERENCES Employee(employee_id),
    FOREIGN KEY (area_id) REFERENCES Delivery_Area(area_id)
 );

-- 9. MANUFACTURER (Only single manufacturer)
 CREATE TABLE Manufacturer (
    manufacturer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    bank_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Insert the only single manufacturer
INSERT INTO Manufacturer (name) VALUES ('Your Manufacturer Name');

-- 11. PRODUCT
CREATE TABLE Product (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(150) NOT NULL,
    product_code VARCHAR(50) UNIQUE,
    product_description TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    low_stock_threshold INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    manufacturer_id INT NOT NULL,
    FOREIGN KEY (manufacturer_id) REFERENCES Manufacturer(manufacturer_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (updated_by) REFERENCES Employee(employee_id),
    INDEX idx_product_manufacturer (manufacturer_id),
    INDEX idx_product_active (is_active)
);

-- 12. STOCK LOCATION (Store or Van)
CREATE TABLE Stock_Location (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_type ENUM('STORE', 'VAN') NOT NULL,
    van_id INT NULL,
    location_name VARCHAR(100),
    FOREIGN KEY (van_id) REFERENCES Van(van_id)
); 

-- 13. STOCK BATCH (tracks expiry and batches)
CREATE TABLE Stock_Batch (
    batch_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    batch_number VARCHAR(50),
    batch_status ENUM('ACTIVE', 'EXPIRED', 'SOLD_OUT', 'DAMAGED') DEFAULT 'ACTIVE',
    quantity INT NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2),
    expiry_date DATE NOT NULL,
    received_date DATE,
    parent_batch_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,

    CONSTRAINT chk_expiry_date CHECK (expiry_date > received_date),
    CONSTRAINT chk_quantity_nonnegative CHECK (quantity >= 0),

    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (location_id) REFERENCES Stock_Location(location_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (updated_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (parent_batch_id) REFERENCES Stock_Batch(batch_id),

    INDEX idx_expiry_date (expiry_date),
    INDEX idx_batch_status (batch_status),
    INDEX idx_product_location (product_id, location_id),
    INDEX idx_batch_location_expiry (location_id, expiry_date),
    INDEX idx_received_date (received_date)
);

-- 14. STOCK TRANSFER (Store to Van tracking)
CREATE TABLE Stock_Transfer (
    transfer_id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transferred_by INT NOT NULL,
    status ENUM('DRAFT', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    notes TEXT,
    FOREIGN KEY (from_location_id) REFERENCES Stock_Location(location_id),
    FOREIGN KEY (to_location_id) REFERENCES Stock_Location(location_id),
    FOREIGN KEY (transferred_by) REFERENCES Employee(employee_id),
    
    INDEX idx_transfer_number (transfer_number),
    INDEX idx_transfer_status (status),
    INDEX idx_transfer_date (transfer_date),
    INDEX idx_transfer_locations (from_location_id, to_location_id)
);

CREATE TABLE Transfer_Items (
    transfer_item_id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_id INT NOT NULL,
    product_id INT NOT NULL,
    source_batch_id INT NOT NULL,     -- Which batch we're taking FROM
    quantity_to_transfer INT NOT NULL, -- How many units to transfer
    unit_price DECIMAL(10,2),         -- Price at time of transfer
    item_status ENUM('PENDING', 'PROCESSED', 'CANCELLED') DEFAULT 'PENDING',
    
    -- For partial transfers - new batch at destination
    destination_batch_id INT NULL,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    
    FOREIGN KEY (transfer_id) REFERENCES Stock_Transfer(transfer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (source_batch_id) REFERENCES Stock_Batch(batch_id),
    FOREIGN KEY (destination_batch_id) REFERENCES Stock_Batch(batch_id),
    
    INDEX idx_transfer_items_transfer (transfer_id),
    INDEX idx_transfer_items_product (product_id),
    INDEX idx_transfer_items_batch (source_batch_id)
);

-- 15. LOYALTY LEVEL (Blue, Bronze, Silver, Gold, Platinum)
CREATE TABLE Loyalty_Level (
    level_id INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(20) NOT NULL,
    minimum_points INT NOT NULL,
    maximum_points INT NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    status_id VARCHAR(10) UNIQUE
);

-- 16. Insert default loyalty levels
INSERT INTO Loyalty_Level (level_name, minimum_points, maximum_points, discount_percentage, status_id) VALUES
('Blue', 0, 1000, 5, 'BLUE'),
('Bronze', 1000, 3000, 7, 'BRONZE'),
('Silver', 3000, 7000, 10, 'SILVER'),
('Gold', 7000, 15000, 15, 'GOLD'),
('Platinum', 15000, 999999, 20, 'PLATINUM');

-- 17. CUSTOMER
CREATE TABLE Customer (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    route_id INT,
    loyalty_points INT DEFAULT 0,
    loyalty_level_id INT DEFAULT 1,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_contact
    CHECK (
        contact IS NULL OR contact REGEXP '^[+0-9]+$'
    ),
    FOREIGN KEY (route_id) REFERENCES Delivery_Route(route_id),
    FOREIGN KEY (loyalty_level_id) REFERENCES Loyalty_Level(level_id),
    INDEX idx_customer_route (route_id),
    INDEX idx_customer_loyalty (loyalty_level_id)
);

-- 18. ORDER (Customer Orders)
CREATE TABLE `Order` (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    employee_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    payment_status ENUM('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_customer_id INT NULL,
    created_by_employee_id INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (created_by_employee_id) REFERENCES Employee(employee_id),
    FOREIGN KEY (created_by_customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (updated_by) REFERENCES Employee(employee_id),
    CONSTRAINT chk_created_by 
    CHECK (
        (created_by_customer_id IS NOT NULL AND created_by_employee_id IS NULL) OR
        (created_by_customer_id IS NULL AND created_by_employee_id IS NOT NULL)
    ),
    CONSTRAINT chk_order_amounts 
    CHECK (
        subtotal >= 0 AND total_amount >= 0 AND discount_amount >= 0
    ),
    INDEX idx_order_employee (employee_id),
    INDEX idx_order_customer (customer_id),
    INDEX idx_order_created_customer (created_by_customer_id),
    INDEX idx_order_created_employee (created_by_employee_id),
    INDEX idx_order_updated (updated_by),
    INDEX idx_order_customer_date (customer_id, order_date DESC),
    INDEX idx_order_status (order_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_date_status (order_date, order_status),
    INDEX idx_order_date (order_date)
);

-- 19. ORDER ITEMS (Junction table for Order and Product)
CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- 20. INVOICE (Generated from Order)
CREATE TABLE Invoice (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    INDEX idx_invoice_order (order_id),
    INDEX idx_invoice_created_by (created_by)
);

-- 21. CUSTOMER PAYMENT (Cash/Cheque from customers)
CREATE TABLE Customer_Payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'CHEQUE') NOT NULL,
    cheque_number VARCHAR(50),
    payment_date DATE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_cheque_payment 
    CHECK (
        (payment_method = 'CASH' AND cheque_number IS NULL) OR
        (payment_method = 'CHEQUE' AND (cheque_number IS NOT NULL AND cheque_number != ''))
    ),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (updated_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id),
    INDEX idx_payment_customer (customer_id),
    INDEX idx_payment_order (order_id),
    INDEX idx_payment_customer_date (customer_id, payment_date DESC),
    INDEX idx_payment_date (payment_date)
);

-- 22. CHEQUE DETAILS (If payment method is CHEQUE)
CREATE TABLE Cheque_Details (
    cheque_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    cheque_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    cheque_date DATE NOT NULL,
    due_date DATE NOT NULL,
    deposit_date DATE,
    deposited_by_employee_id INT,
    clearance_date DATE,
    clearance_updated_by INT,
    cheque_status ENUM(
        'RECEIVED',     -- Cheque received from customer
        'DEPOSITED',    -- Deposited to bank
        'CLEARED',      -- Payment cleared
        'RETURNED',     -- Cheque bounced
        'CANCELLED',    -- Cheque cancelled
        'REDEPOSITED'    -- Cheque redeposited after return
    ) DEFAULT 'RECEIVED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_id) REFERENCES Customer_Payment(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (deposited_by_employee_id) REFERENCES Employee(employee_id),
    FOREIGN KEY (clearance_updated_by) REFERENCES Employee(employee_id),
    
    CONSTRAINT chk_dates CHECK (cheque_date <= due_date),
    CONSTRAINT chk_deposit_dates CHECK (deposit_date IS NULL OR deposit_date >= cheque_date),
    CONSTRAINT chk_clearance_dates CHECK (clearance_date IS NULL OR clearance_date >= deposit_date),
    
    UNIQUE KEY uk_cheque_number_bank (cheque_number, bank_name),
    
    INDEX idx_cheque_status (cheque_status),
    INDEX idx_due_date (due_date),
    INDEX idx_cheque_payment (payment_id)
);

-- 23. CHEQUE RETURN HISTORY
CREATE TABLE Cheque_Return_History (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    cheque_id INT NOT NULL,
    return_date DATE NOT NULL,
    return_reason VARCHAR(255) NOT NULL,
    bank_charges DECIMAL(10,2) DEFAULT 0,
    action_taken ENUM('REDEPOSIT', 'REPLACED', 'LEGAL_ACTION', 'WRITTEN_OFF','PAYMENT_RECOVERED') NOT NULL,
    handled_by_employee_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cheque_id) REFERENCES Cheque_Details(cheque_id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by_employee_id) REFERENCES Employee(employee_id)
);

-- 24. CHEQUE REDEPOSIT HISTORY (if you redeposit returned cheques)
CREATE TABLE Cheque_Redeposit_History (
    redeposit_id INT PRIMARY KEY AUTO_INCREMENT,
    cheque_id INT NOT NULL,
    return_id INT NOT NULL,  -- Which return this redeposit is for
    redeposit_date DATE NOT NULL,
    expected_clearance_date DATE,
    actual_clearance_date DATE,
    redeposited_by_employee_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cheque_id) REFERENCES Cheque_Details(cheque_id),
    FOREIGN KEY (return_id) REFERENCES Cheque_Return_History(return_id),
    FOREIGN KEY (redeposited_by_employee_id) REFERENCES Employee(employee_id)
);


-- 25. PAYMENT METHOD SPECIFIC TABLES (for future expansion)
-- Not implemented in Phase 1
CREATE TABLE Digital_Payment_Details (
    digital_payment_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    payment_gateway ENUM('VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'MOBILE') NOT NULL,
    card_last_four VARCHAR(4),
    approval_code VARCHAR(50),
    gateway_response TEXT,
    settled_date DATE,
    
    FOREIGN KEY (payment_id) REFERENCES Customer_Payment(payment_id) ON DELETE CASCADE,
    UNIQUE KEY uk_transaction_id (transaction_id)
);

-- 26. PURCHASE ORDER (From Manufacturer)
CREATE TABLE Purchase_Order (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    manufacturer_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_status ENUM('PENDING', 'RECEIVED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (manufacturer_id) REFERENCES Manufacturer(manufacturer_id)
);

-- 27. PURCHASE ORDER ITEMS
CREATE TABLE Purchase_Order_Items (
    purchase_item_id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES Purchase_Order(purchase_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_product (product_id)
);

-- 28. MANUFACTURER PAYMENT (Payments to manufacturers)
CREATE TABLE Manufacturer_Payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT,
    manufacturer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    cheque_number VARCHAR(50),
    due_date DATE,
    payment_date DATE,
    payment_status ENUM('PENDING', 'PAID') DEFAULT 'PENDING',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manufacturer_id) REFERENCES Manufacturer(manufacturer_id),
    FOREIGN KEY (purchase_id) REFERENCES Purchase_Order(purchase_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id)
);

-- 29. RETURN REQUEST (Product returns from customers)
CREATE TABLE Return_Request (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    return_reason TEXT,
    quantity INT NOT NULL,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (processed_by) REFERENCES Employee(employee_id),
    INDEX idx_return_order (order_id),
    INDEX idx_return_product (product_id),
    INDEX idx_return_processed_by (processed_by)
);

-- 30. NOTIFICATION
CREATE TABLE Notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT NOT NULL,
    notification_type ENUM('LOW_STOCK', 'EXPIRY_ALERT', 'PAYMENT_DUE', 'VISIT_REMINDER') NOT NULL,
    recipient_type ENUM('CUSTOMER', 'EMPLOYEE') NOT NULL,
    recipient_id INT NOT NULL,
    status ENUM('UNREAD', 'READ') DEFAULT 'UNREAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to_employee_id INT,
    FOREIGN KEY (sent_to_employee_id) REFERENCES Employee(employee_id),
    INDEX idx_notification_recipient (recipient_type, recipient_id),
    INDEX idx_notification_status (status),
    INDEX idx_notification_type (notification_type)
);

-- 31. REPORT (Generated reports)
CREATE TABLE Report (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    report_type VARCHAR(50) NOT NULL,
    generated_by INT NOT NULL,
    file_path VARCHAR(255),
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES Employee(employee_id)
);

-- 32. PRICE HISTORY TABLE (CRITICAL for audit)
CREATE TABLE Price_History (
    price_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    changed_by INT NOT NULL,
    change_reason TEXT,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (changed_by) REFERENCES Employee(employee_id),
    INDEX idx_price_product (product_id),
    INDEX idx_price_changed_by (changed_by),
    INDEX idx_price_effective_from (effective_from)
);

-- 33. STOCK MOVEMENT LOG (For audit trail)
CREATE TABLE Stock_Movement (
    movement_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    batch_id INT,
    from_location_id INT,
    to_location_id INT,
    quantity_change INT NOT NULL,
    movement_type ENUM('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY'),
    reference_id INT,  -- Links to order_id, transfer_id, etc.
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (batch_id) REFERENCES Stock_Batch(batch_id),
    FOREIGN KEY (from_location_id) REFERENCES Stock_Location(location_id),
    FOREIGN KEY (to_location_id) REFERENCES Stock_Location(location_id),
    INDEX idx_movement_batch (batch_id),
    INDEX idx_movement_from (from_location_id),
    INDEX idx_movement_to (to_location_id)
);