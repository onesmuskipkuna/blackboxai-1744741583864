const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ExpenseAttachment extends Model {}

ExpenseAttachment.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    expense_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'expenses',
            key: 'id'
        }
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    original_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    mime_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    attachment_type: {
        type: DataTypes.ENUM(
            'INVOICE',
            'RECEIPT',
            'QUOTATION',
            'PURCHASE_ORDER',
            'CONTRACT',
            'APPROVAL',
            'OTHER'
        ),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'DELETED'),
        defaultValue: 'ACTIVE'
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    deleted_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    checksum: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'MD5 hash of the file for integrity verification'
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the file can be accessed without authentication'
    },
    access_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times the file has been accessed'
    },
    last_accessed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata about the file'
    }
}, {
    sequelize,
    modelName: 'ExpenseAttachment',
    tableName: 'expense_attachments',
    timestamps: true,
    hooks: {
        beforeCreate: async (attachment) => {
            // Generate a unique file name if not provided
            if (!attachment.file_name) {
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(7);
                const extension = attachment.original_name.split('.').pop();
                attachment.file_name = `${timestamp}-${random}.${extension}`;
            }
        },
        afterCreate: async (attachment) => {
            // Update the expense's has_attachments flag
            await sequelize.models.Expense.update(
                { has_attachments: true },
                { where: { id: attachment.expense_id } }
            );
        },
        afterDestroy: async (attachment) => {
            // Check if this was the last attachment and update expense accordingly
            const remainingAttachments = await ExpenseAttachment.count({
                where: {
                    expense_id: attachment.expense_id,
                    status: 'ACTIVE'
                }
            });

            if (remainingAttachments === 0) {
                await sequelize.models.Expense.update(
                    { has_attachments: false },
                    { where: { id: attachment.expense_id } }
                );
            }
        }
    },
    indexes: [
        {
            fields: ['expense_id']
        },
        {
            fields: ['attachment_type']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
ExpenseAttachment.associate = (models) => {
    ExpenseAttachment.belongsTo(models.Expense, {
        foreignKey: 'expense_id',
        as: 'expense'
    });

    ExpenseAttachment.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
    });

    ExpenseAttachment.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'deleter'
    });
};

// Instance methods
ExpenseAttachment.prototype.softDelete = async function(userId) {
    await this.update({
        status: 'DELETED',
        deleted_by: userId,
        deleted_at: new Date()
    });
};

ExpenseAttachment.prototype.recordAccess = async function() {
    await this.update({
        access_count: this.access_count + 1,
        last_accessed_at: new Date()
    });
};

ExpenseAttachment.prototype.getSignedUrl = async function(expiresIn = 3600) {
    // Implementation would depend on your storage solution (S3, GCS, etc.)
    // This is just a placeholder
    return {
        url: `${process.env.STORAGE_URL}/${this.file_path}`,
        expiresAt: new Date(Date.now() + (expiresIn * 1000))
    };
};

ExpenseAttachment.prototype.verifyChecksum = async function(providedChecksum) {
    return this.checksum === providedChecksum;
};

// Static methods
ExpenseAttachment.getAttachmentsByType = async function(expenseId, type) {
    return await this.findAll({
        where: {
            expense_id: expenseId,
            attachment_type: type,
            status: 'ACTIVE'
        },
        order: [['created_at', 'DESC']]
    });
};

module.exports = ExpenseAttachment;
