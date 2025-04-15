const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class PaymentItem extends Model {}

PaymentItem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'payments',
            key: 'id'
        }
    },
    invoice_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'invoice_items',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM(
            'PENDING',
            'COMPLETED',
            'CANCELLED',
            'REFUNDED'
        ),
        defaultValue: 'PENDING'
    },
    refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    refund_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    original_invoice_item_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Original amount of the invoice item at the time of payment'
    },
    payment_sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Order in which items were paid in this payment'
    }
}, {
    sequelize,
    modelName: 'PaymentItem',
    tableName: 'payment_items',
    timestamps: true,
    hooks: {
        beforeCreate: async (paymentItem) => {
            // Get the invoice item to store its current amount
            const invoiceItem = await sequelize.models.InvoiceItem.findByPk(paymentItem.invoice_item_id);
            if (invoiceItem) {
                paymentItem.original_invoice_item_amount = invoiceItem.amount;
            }

            // Validate payment amount doesn't exceed invoice item balance
            if (paymentItem.amount > invoiceItem.balance_amount) {
                throw new Error('Payment amount cannot exceed invoice item balance');
            }
        },
        afterCreate: async (paymentItem) => {
            // Update the invoice item's paid and balance amounts
            const invoiceItem = await sequelize.models.InvoiceItem.findByPk(paymentItem.invoice_item_id);
            if (invoiceItem) {
                await invoiceItem.applyPayment(paymentItem.amount);
            }
        },
        afterUpdate: async (paymentItem) => {
            // If payment is cancelled or refunded, reverse the payment on the invoice item
            if (['CANCELLED', 'REFUNDED'].includes(paymentItem.status)) {
                const invoiceItem = await sequelize.models.InvoiceItem.findByPk(paymentItem.invoice_item_id);
                if (invoiceItem) {
                    await invoiceItem.update({
                        paid_amount: sequelize.literal(`paid_amount - ${paymentItem.amount}`),
                        balance_amount: sequelize.literal(`balance_amount + ${paymentItem.amount}`)
                    });
                }
            }
        }
    },
    indexes: [
        {
            fields: ['payment_id']
        },
        {
            fields: ['invoice_item_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
PaymentItem.associate = (models) => {
    PaymentItem.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        as: 'payment'
    });

    PaymentItem.belongsTo(models.InvoiceItem, {
        foreignKey: 'invoice_item_id',
        as: 'invoiceItem'
    });
};

// Instance methods
PaymentItem.prototype.refund = async function(amount) {
    if (amount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }

    const transaction = await sequelize.transaction();

    try {
        // Update payment item
        await this.update({
            status: 'REFUNDED',
            refund_amount: amount,
            refund_date: new Date()
        }, { transaction });

        // Update invoice item
        const invoiceItem = await this.getInvoiceItem();
        await invoiceItem.update({
            paid_amount: sequelize.literal(`paid_amount - ${amount}`),
            balance_amount: sequelize.literal(`balance_amount + ${amount}`)
        }, { transaction });

        // Update payment status if all items are refunded
        const payment = await this.getPayment();
        const allPaymentItems = await payment.getItems();
        const allRefunded = allPaymentItems.every(item => item.status === 'REFUNDED');
        
        if (allRefunded) {
            await payment.update({
                status: 'REFUNDED'
            }, { transaction });
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

PaymentItem.prototype.cancel = async function() {
    const transaction = await sequelize.transaction();

    try {
        // Update payment item
        await this.update({
            status: 'CANCELLED'
        }, { transaction });

        // Reverse the payment on the invoice item
        const invoiceItem = await this.getInvoiceItem();
        await invoiceItem.update({
            paid_amount: sequelize.literal(`paid_amount - ${this.amount}`),
            balance_amount: sequelize.literal(`balance_amount + ${this.amount}`)
        }, { transaction });

        // Update payment status if all items are cancelled
        const payment = await this.getPayment();
        const allPaymentItems = await payment.getItems();
        const allCancelled = allPaymentItems.every(item => item.status === 'CANCELLED');
        
        if (allCancelled) {
            await payment.update({
                status: 'CANCELLED'
            }, { transaction });
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = PaymentItem;
