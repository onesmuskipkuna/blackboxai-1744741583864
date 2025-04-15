const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User extends Model {
    // Generate JWT token
    generateToken() {
        return jwt.sign(
            { 
                id: this.id,
                email: this.email,
                role: this.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    // Compare password
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'LOCKED'),
        defaultValue: 'ACTIVE'
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    password_changed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    password_reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failed_login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    account_locked_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    must_change_password: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
                user.password_changed_at = new Date();
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['username']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            fields: ['role_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
User.associate = (models) => {
    User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
    });

    User.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
    });

    User.belongsTo(User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    User.belongsTo(User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });

    User.hasMany(models.UserPermission, {
        foreignKey: 'user_id',
        as: 'permissions'
    });

    User.hasMany(models.UserActivity, {
        foreignKey: 'user_id',
        as: 'activities'
    });
};

// Instance methods
User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

User.prototype.hasPermission = async function(permissionCode) {
    const rolePermissions = await this.role.getPermissions();
    const userPermissions = await this.getPermissions();
    
    return rolePermissions.some(p => p.code === permissionCode) ||
           userPermissions.some(p => p.code === permissionCode);
};

User.prototype.isPasswordExpired = function() {
    if (!this.password_changed_at) return false;
    
    const expiryDays = 90; // Password expires after 90 days
    const expiryDate = new Date(this.password_changed_at);
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    return new Date() > expiryDate;
};

User.prototype.incrementFailedLoginAttempts = async function() {
    this.failed_login_attempts += 1;
    
    if (this.failed_login_attempts >= 5) {
        const lockDuration = 30; // Lock account for 30 minutes
        this.account_locked_until = new Date(Date.now() + lockDuration * 60000);
        this.status = 'LOCKED';
    }
    
    await this.save();
};

User.prototype.resetFailedLoginAttempts = async function() {
    this.failed_login_attempts = 0;
    this.account_locked_until = null;
    if (this.status === 'LOCKED') {
        this.status = 'ACTIVE';
    }
    await this.save();
};

User.prototype.generatePasswordResetToken = async function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.password_reset_token = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    this.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await this.save();
    return resetToken;
};

module.exports = User;
