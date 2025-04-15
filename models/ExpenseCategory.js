const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ExpenseCategory extends Model {}

ExpenseCategory.init({
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
            len: [2, 10]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'expense_categories',
            key: 'id'
        }
    },
    budget_limit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    warning_threshold: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Percentage threshold for budget warning'
    },
    requires_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    approval_threshold: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0
        },
        comment: 'Amount threshold above which approval is required'
    },
    tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    },
    color_code: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
            is: /^#[0-9A-F]{6}$/i
        }
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    allow_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    default_payment_mode: {
        type: DataTypes.ENUM(
            'CASH',
            'CHEQUE',
            'BANK_TRANSFER',
            'CREDIT_CARD',
            'DEBIT_CARD',
            'UPI',
            'OTHER'
        ),
        allowNull: true
    },
    requires_vendor: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requires_invoice: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requires_receipt: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    allow_attachments: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    metadata_fields: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Custom fields configuration for this category'
    }
}, {
    sequelize,
    modelName: 'ExpenseCategory',
    tableName: 'expense_categories',
    timestamps: true,
    hooks: {
        beforeCreate: async (category) => {
            // Generate category code if not provided
            if (!category.code) {
                const words = category.name.split(' ');
                let code = words.map(word => word[0].toUpperCase()).join('');
                
                // If code already exists, append a number
                let suffix = 1;
                let newCode = code;
                while (await ExpenseCategory.findOne({ where: { code: newCode } })) {
                    newCode = `${code}${suffix}`;
                    suffix++;
                }
                category.code = newCode;
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
            fields: ['parent_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
ExpenseCategory.associate = (models) => {
    ExpenseCategory.belongsTo(ExpenseCategory, {
        foreignKey: 'parent_id',
        as: 'parent'
    });

    ExpenseCategory.hasMany(ExpenseCategory, {
        foreignKey: 'parent_id',
        as: 'subcategories'
    });

    ExpenseCategory.hasMany(models.Expense, {
        foreignKey: 'category_id',
        as: 'expenses'
    });

    ExpenseCategory.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    ExpenseCategory.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Instance methods
ExpenseCategory.prototype.getTotalExpenses = async function(startDate, endDate) {
    const where = {
        category_id: this.id,
        status: 'APPROVED'
    };

    if (startDate && endDate) {
        where.expense_date = {
            [Op.between]: [startDate, endDate]
        };
    }

    const result = await sequelize.models.Expense.findOne({
        where,
        attributes: [
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
        ]
    });

    return result.getDataValue('total') || 0;
};

ExpenseCategory.prototype.getBudgetUtilization = async function(startDate, endDate) {
    if (!this.budget_limit) return null;

    const totalExpenses = await this.getTotalExpenses(startDate, endDate);
    return (totalExpenses / this.budget_limit) * 100;
};

ExpenseCategory.prototype.isOverBudget = async function(startDate, endDate) {
    if (!this.budget_limit) return false;

    const totalExpenses = await this.getTotalExpenses(startDate, endDate);
    return totalExpenses > this.budget_limit;
};

ExpenseCategory.prototype.needsWarning = async function(startDate, endDate) {
    if (!this.budget_limit || !this.warning_threshold) return false;

    const utilization = await this.getBudgetUtilization(startDate, endDate);
    return utilization >= this.warning_threshold;
};

module.exports = ExpenseCategory;
