const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Expense extends Model {}

Expense.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    expense_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'expense_categories',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    expense_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    payment_mode: {
        type: DataTypes.ENUM(
            'CASH',
            'CHEQUE',
            'BANK_TRANSFER',
            'CREDIT_CARD',
            'DEBIT_CARD',
            'UPI',
            'OTHER'
        ),
        allowNull: false
    },
    payment_status: {
        type: DataTypes.ENUM(
            'PENDING',
            'PAID',
            'PARTIALLY_PAID',
            'CANCELLED'
        ),
        defaultValue: 'PENDING'
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
    vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'vendors',
            key: 'id'
        }
    },
    invoice_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    payment_reference: {
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
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    receipt_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    recurring_frequency: {
        type: DataTypes.ENUM(
            'DAILY',
            'WEEKLY',
            'MONTHLY',
            'QUARTERLY',
            'YEARLY'
        ),
        allowNull: true
    },
    recurring_end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    next_recurring_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            'DRAFT',
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'CANCELLED'
        ),
        defaultValue: 'DRAFT'
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    approval_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
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
    },
    academic_year: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{4}-\d{4}$/
        }
    },
    budget_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'budgets',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
    timestamps: true,
    hooks: {
        beforeCreate: async (expense) => {
            // Generate expense number if not provided
            if (!expense.expense_number) {
                const prefix = 'EXP';
                const year = new Date().getFullYear().toString().substr(-2);
                const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                
                // Get the last expense number for this month
                const lastExpense = await Expense.findOne({
                    where: {
                        expense_number: {
                            [Op.like]: `${prefix}${year}${month}%`
                        }
                    },
                    order: [['expense_number', 'DESC']]
                });

                let sequence = '0001';
                if (lastExpense) {
                    const lastSequence = parseInt(lastExpense.expense_number.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                expense.expense_number = `${prefix}${year}${month}${sequence}`;
            }

            // Calculate total amount
            expense.total_amount = parseFloat(expense.amount) + parseFloat(expense.tax_amount);
            expense.balance_amount = expense.total_amount - expense.paid_amount;
        },
        beforeUpdate: async (expense) => {
            // Update total and balance amounts
            expense.total_amount = parseFloat(expense.amount) + parseFloat(expense.tax_amount);
            expense.balance_amount = expense.total_amount - expense.paid_amount;

            // Update payment status
            if (expense.paid_amount >= expense.total_amount) {
                expense.payment_status = 'PAID';
            } else if (expense.paid_amount > 0) {
                expense.payment_status = 'PARTIALLY_PAID';
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['expense_number']
        },
        {
            fields: ['category_id']
        },
        {
            fields: ['vendor_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['payment_status']
        },
        {
            fields: ['academic_year']
        }
    ]
});

// Define associations
Expense.associate = (models) => {
    Expense.belongsTo(models.ExpenseCategory, {
        foreignKey: 'category_id',
        as: 'category'
    });

    Expense.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        as: 'vendor'
    });

    Expense.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Expense.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });

    Expense.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
    });

    Expense.belongsTo(models.User, {
        foreignKey: 'cancelled_by',
        as: 'canceller'
    });

    Expense.belongsTo(models.Budget, {
        foreignKey: 'budget_id',
        as: 'budget'
    });

    Expense.hasMany(models.ExpenseAttachment, {
        foreignKey: 'expense_id',
        as: 'attachments'
    });
};

module.exports = Expense;
