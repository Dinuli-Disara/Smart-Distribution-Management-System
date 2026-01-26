// backend/models/Employee.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Employee = sequelize.define('Employee', {
  employee_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Name cannot be empty'
      },
      len: {
        args: [2, 100],
        msg: 'Name must be between 2 and 100 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email already exists'
    },
    validate: {
      isEmail: {
        msg: 'Please provide a valid email'
      }
    }
  },
  contact: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9+\-\s()]*$/,
        msg: 'Invalid phone number format'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('Owner', 'Clerk', 'Sales Representative'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Owner', 'Clerk', 'Sales Representative']],
        msg: 'Invalid role'
      }
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'Username already exists'
    },
    validate: {
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      },
      isAlphanumeric: {
        msg: 'Username can only contain letters and numbers'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'Employee',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // Hooks for password hashing
  hooks: {
    beforeCreate: async (employee) => {
      if (employee.password) {
        const salt = await bcrypt.genSalt(10);
        employee.password = await bcrypt.hash(employee.password, salt);
      }
    },
    beforeUpdate: async (employee) => {
      if (employee.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        employee.password = await bcrypt.hash(employee.password, salt);
      }
    }
  }
});

// Instance method to compare password
Employee.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to create password reset token
Employee.prototype.createPasswordResetToken = function() {
  const crypto = require('crypto');
  
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token for storage in database
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token and expiry (10 minutes)
  this.password_reset_token = hashedToken;
  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Return plain token for email
  return resetToken;
};

// Instance method to clear password reset token
Employee.prototype.clearPasswordResetToken = function() {
  this.password_reset_token = null;
  this.password_reset_expires = null;
  return this;
};

// Instance method to check if reset token is valid
Employee.prototype.isResetTokenValid = function() {
  if (!this.password_reset_token || !this.password_reset_expires) {
    return false;
  }
  return Date.now() < this.password_reset_expires;
};

// Instance method to validate reset token
Employee.prototype.validateResetToken = function(token) {
  const crypto = require('crypto');
  
  if (!token || !this.password_reset_token) {
    return false;
  }
  
  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Compare with stored token and check expiry
  return hashedToken === this.password_reset_token && 
         this.isResetTokenValid();
};

// Instance method to hide password in JSON response
Employee.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Employee;