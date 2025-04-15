const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Permission extends Model {}

Permission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 100]
        }
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 50]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    module: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Module/section this permission belongs to'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Category of permission (e.g., VIEW, CREATE, UPDATE, DELETE)'
    },
    is_system_permission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'System permissions cannot be modified or deleted'
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    hooks: {
        beforeDestroy: async (permission) => {
            if (permission.is_system_permission) {
                throw new Error('System permissions cannot be deleted');
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['name']
        },
        {
            unique: true,
            fields: ['code']
        },
        {
            fields: ['module']
        },
        {
            fields: ['category']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
        through: 'role_permissions',
        foreignKey: 'permission_id',
        otherKey: 'role_id',
        as: 'roles'
    });

    Permission.belongsToMany(models.User, {
        through: 'user_permissions',
        foreignKey: 'permission_id',
        otherKey: 'user_id',
        as: 'users'
    });

    Permission.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Permission.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Class methods
Permission.generateCode = function(module, action) {
    return `${module.toUpperCase()}_${action.toUpperCase()}`;
};

// Instance methods
Permission.prototype.isAssignedToRole = async function(roleId) {
    const count = await sequelize.models.RolePermission.count({
        where: {
            role_id: roleId,
            permission_id: this.id
        }
    });
    return count > 0;
};

Permission.prototype.isAssignedToUser = async function(userId) {
    const count = await sequelize.models.UserPermission.count({
        where: {
            user_id: userId,
            permission_id: this.id
        }
    });
    return count > 0;
};

// Static method to create default permissions
Permission.createDefaultPermissions = async (createdBy) => {
    const defaultModules = [
        'USERS',
        'ROLES',
        'STUDENTS',
        'EMPLOYEES',
        'FEES',
        'EXPENSES',
        'PAYROLL',
        'REPORTS'
    ];

    const defaultActions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

    const permissions = [];
    for (const module of defaultModules) {
        for (const action of defaultActions) {
            permissions.push({
                name: `${module} ${action}`,
                code: Permission.generateCode(module, action),
                description: `Permission to ${action.toLowerCase()} ${module.toLowerCase()}`,
                module: module,
                category: action,
                is_system_permission: true,
                created_by: createdBy
            });
        }
    }

    // Additional specific permissions
    const specificPermissions = [
        {
            name: 'Approve Expenses',
            code: 'EXPENSES_APPROVE',
            description: 'Permission to approve expenses',
            module: 'EXPENSES',
            category: 'APPROVE',
            is_system_permission: true,
            created_by: createdBy
        },
        {
            name: 'Process Payroll',
            code: 'PAYROLL_PROCESS',
            description: 'Permission to process payroll',
            module: 'PAYROLL',
            category: 'PROCESS',
            is_system_permission: true,
            created_by: createdBy
        },
        {
            name: 'Generate Reports',
            code: 'REPORTS_GENERATE',
            description: 'Permission to generate reports',
            module: 'REPORTS',
            category: 'GENERATE',
            is_system_permission: true,
            created_by: createdBy
        }
    ];

    permissions.push(...specificPermissions);

    // Create all permissions
    await Permission.bulkCreate(permissions);
};

module.exports = Permission;
