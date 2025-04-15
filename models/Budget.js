const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Budget extends Model {}

Budget.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    academic_year: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{4}-\d{4}$/
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    allocated_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    utilized_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    remaining_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM(
            'DRAFT',
            'ACTIVE',
            'CLOSED',
            'CANCELLED'
        ),
        defaultValue: 'DRAFT'
    },
    type: {
        type: DataTypes.ENUM(
            'ANNUAL',
            'TERM',
            'MONTHLY',
            'PROJECT',
            'SPECIAL'
        ),
        allowNull: false
    },
    category_allocations: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Budget allocations by expense category'
    },
    monthly_allocations: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Monthly budget breakdown'
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
    freeze_threshold: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Percentage threshold to freeze budget'
    },
    approval_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether expenses need approval when budget is exceeded'
    },
    notes: {
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
    closed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    closure_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    closure_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    last_rollover_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when budget was last rolled over'
    }
}, {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    hooks: {
        beforeCreate: (budget) => {
            budget.remaining_amount = budget.total_amount - budget.allocated_amount;
        },
        beforeUpdate: (budget) => {
            budget.remaining_amount = budget.total_amount - budget.allocated_amount;
        }
    },
    indexes: [
        {
            fields: ['academic_year']
        },
        {
            fields: ['status']
        },
        {
            fields: ['type']
        }
    ]
});

// Define associations
Budget.associate = (models) => {
    Budget.hasMany(models.Expense, {
        foreignKey: 'budget_id',
        as: 'expenses'
    });

    Budget.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Budget.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });

    Budget.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
    });

    Budget.belongsTo(models.User, {
        foreignKey: 'closed_by',
        as: 'closer'
    });
};

// Instance methods
Budget.prototype.allocate = async function(categoryId, amount) {
    const allocations = this.category_allocations || {};
    const currentAllocation = parseFloat(allocations[categoryId] || 0);
    const newAllocation = currentAllocation + parseFloat(amount);

    if (newAllocation > this.remaining_amount) {
        throw new Error('Insufficient budget for allocation');
    }

    allocations[categoryId] = newAllocation;
    
    await this.update({
        category_allocations: allocations,
        allocated_amount: sequelize.literal(`allocated_amount + ${amount}`),
        remaining_amount: sequelize.literal(`remaining_amount - ${amount}`)
    });
};

Budget.prototype.trackExpense = async function(amount) {
    await this.update({
        utilized_amount: sequelize.literal(`utilized_amount + ${amount}`)
    });
};

Budget.prototype.approve = async function(userId) {
    if (this.status !== 'DRAFT') {
        throw new Error('Only draft budgets can be approved');
    }

    await this.update({
        status: 'ACTIVE',
        approved_by: userId,
        approval_date: new Date()
    });
};

Budget.prototype.close = async function(userId, notes) {
    if (this.status !== 'ACTIVE') {
        throw new Error('Only active budgets can be closed');
    }

    await this.update({
        status: 'CLOSED',
        closed_by: userId,
        closure_date: new Date(),
        closure_notes: notes
    });
};

Budget.prototype.isOverBudget = function() {
    return this.utilized_amount > this.total_amount;
};

Budget.prototype.getUtilizationPercentage = function() {
    return (this.utilized_amount / this.total_amount) * 100;
};

Budget.prototype.needsWarning = function() {
    if (!this.warning_threshold) return false;
    return this.getUtilizationPercentage() >= this.warning_threshold;
};

Budget.prototype.isFrozen = function() {
    if (!this.freeze_threshold) return false;
    return this.getUtilizationPercentage() >= this.freeze_threshold;
};

// Static methods
Budget.getCurrentBudget = async function(type = 'ANNUAL') {
    return await this.findOne({
        where: {
            type,
            status: 'ACTIVE',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            }
        }
    });
};

module.exports = Budget;
