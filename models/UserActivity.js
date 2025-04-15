const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UserActivity extends Model {}

UserActivity.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    activity_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Type of activity (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)'
    },
    module: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Module where the activity occurred'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Description of the activity'
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'IP address of the user'
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Browser/device information'
    },
    entity_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Type of entity affected (e.g., User, Student, Invoice)'
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the affected entity'
    },
    old_values: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Previous values before change'
    },
    new_values: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'New values after change'
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
        defaultValue: 'SUCCESS'
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if activity failed'
    },
    additional_info: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Any additional information about the activity'
    }
}, {
    sequelize,
    modelName: 'UserActivity',
    tableName: 'user_activities',
    timestamps: true,
    updatedAt: false, // Only need created_at for activity logs
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['activity_type']
        },
        {
            fields: ['module']
        },
        {
            fields: ['entity_type', 'entity_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

// Define associations
UserActivity.associate = (models) => {
    UserActivity.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });
};

// Class methods
UserActivity.logActivity = async function(data) {
    try {
        return await UserActivity.create({
            user_id: data.user_id,
            activity_type: data.activity_type,
            module: data.module,
            description: data.description,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            old_values: data.old_values,
            new_values: data.new_values,
            status: data.status || 'SUCCESS',
            error_message: data.error_message,
            additional_info: data.additional_info
        });
    } catch (error) {
        console.error('Failed to log user activity:', error);
        // Don't throw error as logging should not affect main functionality
        return null;
    }
};

UserActivity.logLogin = async function(userId, success, ipAddress, userAgent, errorMessage = null) {
    return await UserActivity.logActivity({
        user_id: userId,
        activity_type: 'LOGIN',
        module: 'AUTH',
        description: success ? 'User logged in successfully' : 'Login attempt failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: success ? 'SUCCESS' : 'FAILURE',
        error_message: errorMessage
    });
};

UserActivity.logLogout = async function(userId, ipAddress, userAgent) {
    return await UserActivity.logActivity({
        user_id: userId,
        activity_type: 'LOGOUT',
        module: 'AUTH',
        description: 'User logged out',
        ip_address: ipAddress,
        user_agent: userAgent
    });
};

UserActivity.logPasswordChange = async function(userId, success, ipAddress, userAgent, errorMessage = null) {
    return await UserActivity.logActivity({
        user_id: userId,
        activity_type: 'PASSWORD_CHANGE',
        module: 'AUTH',
        description: success ? 'Password changed successfully' : 'Password change failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: success ? 'SUCCESS' : 'FAILURE',
        error_message: errorMessage
    });
};

UserActivity.logEntityChange = async function(userId, entityType, entityId, action, oldValues, newValues, ipAddress) {
    return await UserActivity.logActivity({
        user_id: userId,
        activity_type: action,
        module: entityType.toUpperCase(),
        description: `${action} ${entityType} #${entityId}`,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress
    });
};

// Instance methods
UserActivity.prototype.getFormattedTimestamp = function() {
    return this.created_at.toLocaleString();
};

UserActivity.prototype.getDuration = function() {
    if (!this.additional_info?.duration) return null;
    return `${this.additional_info.duration}ms`;
};

UserActivity.prototype.getChangesSummary = function() {
    if (!this.old_values || !this.new_values) return null;

    const changes = [];
    for (const key in this.new_values) {
        if (this.old_values[key] !== this.new_values[key]) {
            changes.push({
                field: key,
                old: this.old_values[key],
                new: this.new_values[key]
            });
        }
    }
    return changes;
};

module.exports = UserActivity;
