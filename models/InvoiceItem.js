const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class InvoiceItem extends Model {}

InvoiceItem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    fee_structure_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'fee_structure_items',
            key: 'id'
        }
    },
    item_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    balance_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_carried_forward: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    carried_forward_from: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'invoice_items',
            key: 'id'
        }
    },
    payment_status: {
        type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'),
        defaultValue: 'UNPAID'
    },
    waiver_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    waiver_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    waiver_approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    waiver_approved_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items',
    timestamps: true,
    hooks: {
        beforeCreate: (item) => {
            // Set initial balance amount if not set
            if (!item.balance_amount) {
                item.balance_amount = item.amount - item.paid_amount - item.waiver_amount;
            }

            // Set initial payment status
            if (item.due_date < new Date()) {
                item.payment_status = 'OVERDUE';
            }
        },
        beforeUpdate: (item) => {
            // Update payment status based on payments and waivers
            const totalPaid = parseFloat(item.paid_amount) + parseFloat(item.waiver_amount);
            
            if (totalPaid >= item.amount) {
                item.payment_status = 'PAID';
                item.balance_amount = 0;
            } else if (totalPaid > 0) {
                item.payment_status = 'PARTIALLY_PAID';
                item.balance_amount = item.amount - totalPaid;
            } else if (item.due_date < new Date()) {
                item.payment_status = 'OVERDUE';
                item.balance_amount = item.amount;
            } else {
                item.payment_status = 'UNPAID';
                item.balance_amount = item.amount;
            }
        }
    },
    indexes: [
        {
            fields: ['invoice_id']
        },
        {
            fields: ['fee_structure_item_id']
        },
        {
            fields: ['payment_status']
        }
    ]
});

// Define associations
InvoiceItem.associate = (models) => {
    InvoiceItem.belongsTo(models.Invoice, {
        foreignKey: 'invoice_id',
        as: 'invoice'
    });

    InvoiceItem.belongsTo(models.FeeStructureItem, {
        foreignKey: 'fee_structure_item_id',
        as: 'feeStructureItem'
    });

    InvoiceItem.belongsTo(models.InvoiceItem, {
        foreignKey: 'carried_forward_from',
        as: 'originalItem'
    });

    InvoiceItem.hasMany(models.InvoiceItem, {
        foreignKey: 'carried_forward_from',
        as: 'carriedForwardItems'
    });

    InvoiceItem.belongsTo(models.User, {
        foreignKey: 'waiver_approved_by',
        as: 'waiverApprover'
    });

    InvoiceItem.hasMany(models.PaymentItem, {
        foreignKey: 'invoice_item_id',
        as: 'paymentItems'
    });
};

// Instance methods
InvoiceItem.prototype.applyPayment = async function(amount) {
    const remainingBalance = this.balance_amount;
    const paymentAmount = Math.min(amount, remainingBalance);
    
    await this.update({
        paid_amount: this.paid_amount + paymentAmount,
        balance_amount: this.balance_amount - paymentAmount
    });

    return paymentAmount;
};

InvoiceItem.prototype.applyWaiver = async function(amount, reason, approvedBy) {
    if (amount > this.balance_amount) {
        throw new Error('Waiver amount cannot exceed balance amount');
    }

    await this.update({
        waiver_amount: this.waiver_amount + amount,
        waiver_reason: reason,
        waiver_approved_by: approvedBy,
        waiver_approved_date: new Date(),
        balance_amount: this.balance_amount - amount
    });
};

module.exports = InvoiceItem;
