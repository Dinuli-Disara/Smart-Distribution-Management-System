// backend/seeds/seedDatabase.js
require('dotenv').config();
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 1. SEED ADMIN USER
    console.log('\n📌 Seeding Admin User...');
    const hashedPassword = await hashPassword('admin123');
    
    await sequelize.query(`
      INSERT INTO Employee (name, email, contact, role, username, password, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = username
    `, {
      replacements: [
        'System Admin',
        'admin@manjulamarketing.com',
        '0771234567',
        'Owner',
        'admin',
        hashedPassword,
        true,
        null,
        null
      ]
    });

    // Get admin ID
    const [adminResult] = await sequelize.query(`
      SELECT employee_id FROM Employee WHERE username = 'admin'
    `);
    const adminId = adminResult[0].employee_id;

    // Update self-reference
    await sequelize.query(`
      UPDATE Employee 
      SET created_by = ?, updated_by = ? 
      WHERE employee_id = ?
    `, {
      replacements: [adminId, adminId, adminId]
    });

    console.log('✅ Admin user created');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    // 2. SEED MANUFACTURER
    console.log('\n📌 Seeding Manufacturer...');
    await sequelize.query(`
      INSERT INTO Manufacturer (name, contact_person, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = name
    `, {
      replacements: [
        'Harumi Holdings (Pvt) Ltd',
        'Mr. Harumi Manager',
        '0112345678',
        'contact@harumi.lk',
        'Colombo, Sri Lanka'
      ]
    });
    console.log('✅ Manufacturer created');

    // 3. SEED LOYALTY LEVELS
    console.log('\n📌 Seeding Loyalty Levels...');
    await sequelize.query(`
      INSERT INTO Loyalty_Level (level_name, minimum_points, maximum_points, discount_percentage, status_id)
      VALUES 
        ('Blue', 0, 999, 5, 'BLUE'),
        ('Bronze', 1000, 2999, 7, 'BRONZE'),
        ('Silver', 3000, 6999, 10, 'SILVER'),
        ('Gold', 7000, 14999, 15, 'GOLD'),
        ('Platinum', 15000, 999999, 20, 'PLATINUM')
      ON DUPLICATE KEY UPDATE level_name = level_name
    `);
    console.log('✅ Loyalty levels created');

    // 4. SEED DELIVERY AREAS
    console.log('\n📌 Seeding Delivery Areas...');
    await sequelize.query(`
      INSERT INTO Delivery_Area (area_name, number_of_routes)
      VALUES 
        ('Battaramulla', 2),
        ('Nugegoda', 2),
        ('Kiribathgoda', 1)
      ON DUPLICATE KEY UPDATE area_name = area_name
    `);
    console.log('✅ Delivery areas created');

    // Get area IDs
    const [areas] = await sequelize.query(`SELECT area_id, area_name FROM Delivery_Area`);

    // 5. SEED DELIVERY ROUTES
    console.log('\n📌 Seeding Delivery Routes...');
    for (const area of areas) {
      const numRoutes = area.area_name === 'Kiribathgoda' ? 1 : 2;
      for (let i = 1; i <= numRoutes; i++) {
        await sequelize.query(`
          INSERT INTO Delivery_Route (area_id, route_name)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE route_name = route_name
        `, {
          replacements: [area.area_id, `${area.area_name} Route ${i}`]
        });
      }
    }
    console.log('✅ Delivery routes created');

    // 6. SEED STOCK LOCATIONS
    console.log('\n📌 Seeding Stock Locations...');
    
    // Main Store
    await sequelize.query(`
      INSERT INTO Stock_Location (location_type, van_id, location_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE location_name = location_name
    `, {
      replacements: ['STORE', null, 'Main Store - Malabe']
    });
    console.log('✅ Main store location created');

    // 7. SEED SAMPLE EMPLOYEES
    console.log('\n📌 Seeding Sample Employees...');
    
    // Clerk
    const clerkPassword = await hashPassword('clerk123');
    await sequelize.query(`
      INSERT INTO Employee (name, email, contact, role, username, password, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = username
    `, {
      replacements: [
        'Nimal Perera',
        'clerk@manjulamarketing.com',
        '0771234568',
        'Clerk',
        'clerk',
        clerkPassword,
        true,
        adminId,
        adminId
      ]
    });

    // Sales Representative
    const salesPassword = await hashPassword('sales123');
    await sequelize.query(`
      INSERT INTO Employee (name, email, contact, role, username, password, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = username
    `, {
      replacements: [
        'Kamal Silva',
        'sales@manjulamarketing.com',
        '0771234569',
        'Sales Representative',
        'salesrep',
        salesPassword,
        true,
        adminId,
        adminId
      ]
    });
    console.log('✅ Sample employees created');
    console.log('   Clerk - Username: clerk, Password: clerk123');
    console.log('   Sales Rep - Username: salesrep, Password: sales123');

    // 8. SEED SAMPLE PRODUCTS
    console.log('\n📌 Seeding Sample Products...');
    const [manufacturer] = await sequelize.query(`SELECT manufacturer_id FROM Manufacturer LIMIT 1`);
    const manufacturerId = manufacturer[0].manufacturer_id;

    const products = [
      ['Shampoo 200ml', 'SHAM001', 'Anti-dandruff shampoo', 450.00],
      ['Conditioner 200ml', 'COND001', 'Hair conditioner', 480.00],
      ['Face Wash 100ml', 'FACE001', 'Gentle face wash', 380.00],
      ['Body Lotion 250ml', 'BODY001', 'Moisturizing body lotion', 550.00],
      ['Sunscreen 50ml', 'SUN001', 'SPF 50 sunscreen', 680.00]
    ];

    for (const product of products) {
      await sequelize.query(`
        INSERT INTO Product (product_name, product_code, product_description, unit_price, low_stock_threshold, manufacturer_id, created_by, updated_by, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE product_code = product_code
      `, {
        replacements: [...product, 10, manufacturerId, adminId, adminId, true]
      });
    }
    console.log('✅ Sample products created');

    // 9. SEED SAMPLE CUSTOMERS
    console.log('\n📌 Seeding Sample Customers...');
    const [routes] = await sequelize.query(`SELECT route_id FROM Delivery_Route LIMIT 3`);
    
    const customerPassword = await hashPassword('customer123');
    
    const customers = [
      ['Saman Shop', '0771111111', 'saman@shop.lk', 'No 10, Main St, Battaramulla', routes[0].route_id, 'saman'],
      ['Nadeeka Stores', '0772222222', 'nadeeka@store.lk', 'No 25, High St, Nugegoda', routes[1].route_id, 'nadeeka'],
      ['Lucky Mart', '0773333333', 'lucky@mart.lk', 'No 15, Station Rd, Kiribathgoda', routes[2].route_id, 'lucky']
    ];

    for (const customer of customers) {
      await sequelize.query(`
        INSERT INTO Customer (name, contact, email, address, route_id, loyalty_points, loyalty_level_id, username, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE username = username
      `, {
        replacements: [...customer, 0, 1, customerPassword]
      });
    }
    console.log('✅ Sample customers created');
    console.log('   Username: saman, nadeeka, lucky');
    console.log('   Password: customer123 (for all)');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary of Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Owner:     username: admin     | password: admin123');
    console.log('Clerk:     username: clerk     | password: clerk123');
    console.log('Sales Rep: username: salesrep  | password: sales123');
    console.log('Customer:  username: saman     | password: customer123');
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run seed
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });