const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Invoice extends Model {}

Invoice.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        }
    },
    fee_structure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'fee_structures',
            key: 'id'
        }
    },
    academic_year: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{4}-\d{4}$/
        }
    },
    term: {
        type: DataTypes.ENUM('TERM_1', 'TERM_2', 'TERM_3'),
        allowNull: false
    },
    class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total_amount: {
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
    status: {
        type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'),
        defaultValue: 'UNPAID'
    },
    payment_status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
        defaultValue: 'PENDING'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    generated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
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
    last_reminder_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reminder_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    hooks: {
        beforeCreate: async (invoice) => {
            // Generate invoice number if not provided
            if (!invoice.invoice_number) {
                const prefix = 'INV';
                const year = new Date().getFullYear().toString().substr(-2);
                const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                
                // Get the last invoice number for this month
                const lastInvoice = await Invoice.findOne({
                    where: {
                        invoice_number: {
                            [Op.like]: `${prefix}${year}${month}%`
                        }
                    },
                    order: [['invoice_number', 'DESC']]
                });

                let sequence = '0001';
                if (lastInvoice) {
                    const lastSequence = parseInt(lastInvoice.invoice_number.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                invoice.invoice_number = `${prefix}${year}${month}${sequence}`;
            }

            // Set balance amount if not set
            if (!invoice.balance_amount) {
                invoice.balance_amount = invoice.total_amount - invoice.paid_amount;
            }

            // Set initial status based on due date
            if (invoice.due_date < new Date()) {
                invoice.status = 'OVERDUE';
            }
        },
        beforeUpdate: async (invoice) => {
            // Update status based on payments
            if (invoice.paid_amount >= invoice.total_amount) {
                invoice.status = 'PAID';
                invoice.payment_status = 'COMPLETED';
            } else if (invoice.paid_amount > 0) {
                invoice.status = 'PARTIALLY_PAID';
                invoice.payment_status = 'IN_PROGRESS';
            } else if (invoice.due_date < new Date()) {
                invoice.status = 'OVERDUE';
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['invoice_number']
        },
        {
            fields: ['student_id']
        },
        {
            fields: ['fee_structure_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Invoice.associate = (models) => {
    Invoice.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
    });
    
    Invoice.belongsTo(models.FeeStructure, {
        foreignKey: 'fee_structure_id',
        as: 'feeStructure'
    });

    Invoice.hasMany(models.InvoiceItem, {
        foreignKey: 'invoice_id',
        as: 'items'
    });

    Invoice.hasMany(models.Payment, {
        foreignKey: 'invoice_id',
        as: 'payments'
    });

    Invoice.belongsTo(models.User, {
        foreignKey: 'generated_by',
        as: 'generator'
    });

    Invoice.belongsTo(models.User, {
        foreignKey: 'cancelled_by',
        as: 'canceller'
    });
};

module.exports = Invoice;
