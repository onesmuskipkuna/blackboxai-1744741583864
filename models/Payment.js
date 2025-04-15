const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Payment extends Model {}

Payment.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
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
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    payment_mode: {
        type: DataTypes.ENUM(
            'CASH',
            'CHEQUE',
            'BANK_TRANSFER',
            'CREDIT_CARD',
            'DEBIT_CARD',
            'UPI',
            'MOBILE_WALLET',
            'OTHER'
        ),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED',
            'CANCELLED',
            'REFUNDED'
        ),
        defaultValue: 'PENDING'
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cheque_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cheque_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    upi_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    card_last_digits: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    receipt_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    collected_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verified_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verification_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    cancellation_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
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
    refund_reference: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    hooks: {
        beforeCreate: async (payment) => {
            // Generate payment number if not provided
            if (!payment.payment_number) {
                const prefix = 'PMT';
                const year = new Date().getFullYear().toString().substr(-2);
                const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                
                // Get the last payment number for this month
                const lastPayment = await Payment.findOne({
                    where: {
                        payment_number: {
                            [Op.like]: `${prefix}${year}${month}%`
                        }
                    },
                    order: [['payment_number', 'DESC']]
                });

                let sequence = '0001';
                if (lastPayment) {
                    const lastSequence = parseInt(lastPayment.payment_number.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                payment.payment_number = `${prefix}${year}${month}${sequence}`;
            }

            // Generate receipt number if not provided
            if (!payment.receipt_number) {
                const prefix = 'RCP';
                const year = new Date().getFullYear().toString().substr(-2);
                const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                
                // Get the last receipt number for this month
                const lastReceipt = await Payment.findOne({
                    where: {
                        receipt_number: {
                            [Op.like]: `${prefix}${year}${month}%`
                        }
                    },
                    order: [['receipt_number', 'DESC']]
                });

                let sequence = '0001';
                if (lastReceipt) {
                    const lastSequence = parseInt(lastReceipt.receipt_number.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                payment.receipt_number = `${prefix}${year}${month}${sequence}`;
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['payment_number']
        },
        {
            unique: true,
            fields: ['receipt_number']
        },
        {
            fields: ['invoice_id']
        },
        {
            fields: ['student_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Payment.associate = (models) => {
    Payment.belongsTo(models.Invoice, {
        foreignKey: 'invoice_id',
        as: 'invoice'
    });

    Payment.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
    });

    Payment.hasMany(models.PaymentItem, {
        foreignKey: 'payment_id',
        as: 'items'
    });

    Payment.belongsTo(models.User, {
        foreignKey: 'collected_by',
        as: 'collector'
    });

    Payment.belongsTo(models.User, {
        foreignKey: 'verified_by',
        as: 'verifier'
    });

    Payment.belongsTo(models.User, {
        foreignKey: 'cancelled_by',
        as: 'canceller'
    });
};

// Instance methods
Payment.prototype.verify = async function(verifierId) {
    await this.update({
        status: 'COMPLETED',
        verified_by: verifierId,
        verification_date: new Date()
    });
};

Payment.prototype.cancel = async function(cancellerId, reason) {
    await this.update({
        status: 'CANCELLED',
        cancelled_by: cancellerId,
        cancellation_date: new Date(),
        cancellation_reason: reason
    });
};

Payment.prototype.refund = async function(amount, reference) {
    if (amount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }

    await this.update({
        status: 'REFUNDED',
        refund_amount: amount,
        refund_date: new Date(),
        refund_reference: reference
    });
};

module.exports = Payment;
