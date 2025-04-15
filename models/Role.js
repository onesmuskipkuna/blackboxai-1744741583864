const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Role extends Model {}

Role.init({
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
            len: [2, 50]
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
    is_system_role: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'System roles cannot be modified or deleted'
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
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    hooks: {
        beforeDestroy: async (role) => {
            if (role.is_system_role) {
                throw new Error('System roles cannot be deleted');
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
            fields: ['status']
        }
    ]
});

// Define associations
Role.associate = (models) => {
    Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users'
    });

    Role.belongsToMany(models.Permission, {
        through: 'role_permissions',
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'permissions'
    });

    Role.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Role.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Instance methods
Role.prototype.hasPermission = function(permissionCode) {
    return this.permissions.some(permission => permission.code === permissionCode);
};

Role.prototype.addPermissions = async function(permissionIds) {
    await sequelize.models.RolePermission.bulkCreate(
        permissionIds.map(id => ({
            role_id: this.id,
            permission_id: id
        }))
    );
};

Role.prototype.removePermissions = async function(permissionIds) {
    await sequelize.models.RolePermission.destroy({
        where: {
            role_id: this.id,
            permission_id: permissionIds
        }
    });
};

Role.prototype.syncPermissions = async function(permissionIds) {
    await sequelize.models.RolePermission.destroy({
        where: { role_id: this.id }
    });

    if (permissionIds.length) {
        await this.addPermissions(permissionIds);
    }
};

module.exports = Role;
