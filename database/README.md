# Database Documentation
## Manjula Marketing Distribution Management System

---

## 📁 Folder Structure

```
database/
├── schema/              # Individual table creation scripts (split for easier management)
├── seeds/               # Initial data insertion scripts
├── queries/             # Common SQL queries
├── migrations/          # Database version control
├── setup.sql            # Complete setup script (run this first!)
└── README.md            # This file
```

---

## 🚀 Quick Setup Guide

### Method 1: Using setup.sql (Recommended)

```bash
# Open terminal in database folder
mysql -u root -p < setup.sql
```

### Method 2: Using phpMyAdmin (XAMPP)

1. Start XAMPP (Apache + MySQL)
2. Open phpMyAdmin: http://localhost/phpmyadmin
3. Click "Import" tab
4. Choose `setup.sql`
5. Click "Go"

### Method 3: MySQL Workbench

1. Open MySQL Workbench
2. Connect to your server
3. File → Open SQL Script → Select `setup.sql`
4. Execute (⚡ icon)

---

## 📊 Database Schema Overview

### Core Tables (7)
- **Employee** - System users (Owner, Clerk, Sales Rep)
- **Delivery_Area** - Geographic areas
- **Delivery_Route** - Routes within areas
- **Van** - Delivery vehicles
- **Manufacturer** - Single manufacturer (Harumi Holdings)
- **Product** - Product catalog
- **Stock_Location** - Store and Van locations

### Inventory Management (4)
- **Stock_Batch** - Product batches with expiry tracking
- **Stock_Transfer** - Store to Van transfers
- **Transfer_Items** - Individual items in transfers
- **Stock_Movement** - Audit trail for all movements

### Customer & Orders (5)
- **Loyalty_Level** - Customer reward tiers
- **Customer** - Customer information
- **Order** - Customer orders
- **Order_Items** - Products in each order
- **Invoice** - Generated invoices

### Payments (7)
- **Customer_Payment** - Payments from customers
- **Cheque_Details** - Cheque tracking
- **Cheque_Return_History** - Bounced cheques
- **Cheque_Redeposit_History** - Redeposit tracking
- **Digital_Payment_Details** - Future digital payments
- **Manufacturer_Payment** - Payments to manufacturer
- **Price_History** - Price change audit

### Purchase Orders (2)
- **Purchase_Order** - Orders to manufacturer
- **Purchase_Order_Items** - Items in purchase orders

### Auxiliary (3)
- **Return_Request** - Product returns
- **Notification** - System notifications
- **Report** - Generated reports

---

## 🔐 Default Credentials

After running setup.sql:

**Admin User:**
- Username: `admin`
- Password: `admin123` (CHANGE THIS IN PRODUCTION!)
- Role: Owner

**Manufacturer:**
- Name: Harumi Holdings (Pvt) Ltd

**Loyalty Levels:**
- Blue (0-1000 points, 5% discount)
- Bronze (1000-3000 points, 7% discount)
- Silver (3000-7000 points, 10% discount)
- Gold (7000-15000 points, 15% discount)
- Platinum (15000+ points, 20% discount)

---

## 📝 Common Operations

### Reset Database
```sql
DROP DATABASE IF EXISTS manjula_marketing;
SOURCE setup.sql;
```

### Backup Database
```bash
mysqldump -u root -p manjula_marketing > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u root -p manjula_marketing < backup_20250121.sql
```

### Check Database Size
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'manjula_marketing'
GROUP BY table_schema;
```

---

## 🔍 Useful Queries

### View All Tables
```sql
SHOW TABLES;
```

### Check Table Structure
```sql
DESCRIBE Employee;
-- or
SHOW CREATE TABLE Employee;
```

### View Foreign Keys
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'manjula_marketing'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## ⚠️ Important Notes

1. **First-time Setup**: The setup script creates the first admin user with a default password. **CHANGE THIS IMMEDIATELY IN PRODUCTION!**

2. **Foreign Key Constraints**: Some tables use self-referencing foreign keys (like Employee). The setup script handles this properly.

3. **Character Set**: Database uses `utf8mb4_unicode_ci` for full Unicode support (including emojis).

4. **Timestamps**: Most tables have `created_at` and `updated_at` timestamps that auto-update.

5. **Soft Deletes**: Some tables use `is_active` flag instead of actual deletion to maintain data integrity.

---

## 🛠️ Maintenance

### Check for Expired Products (Run Daily)
```sql
-- See: queries/inventory_queries.sql
SELECT * FROM Stock_Batch 
WHERE expiry_date <= CURDATE() 
AND batch_status = 'ACTIVE';
```

### Update Loyalty Levels (Run After Orders)
```sql
-- See: queries/customer_queries.sql
-- Auto-updated via triggers or application logic
```

### Generate Daily Sales Report
```sql
-- See: queries/report_queries.sql
```

---

## 📞 Support

For database-related issues:
1. Check error logs
2. Verify foreign key constraints
3. Check data types and constraints
4. Review transaction logs

---

## 🔄 Version History

- **v1.0.0** (2025-01-21) - Initial schema
  - 33 tables
  - Full CRUD operations
  - Audit trail support
  - Cheque management
  - Loyalty system