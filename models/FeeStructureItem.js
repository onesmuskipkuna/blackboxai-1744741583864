const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeeStructureItem extends Model {}

FeeStructureItem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fee_structure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'fee_structures',
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
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    is_mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'If true, this fee applies to each term'
    },
    payment_frequency: {
        type: DataTypes.ENUM('ONCE', 'TERM', 'ANNUAL'),
        defaultValue: 'TERM'
    },
    due_date_offset: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Days from term start when fee is due'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Category of fee (e.g., Tuition, Transport, Library)'
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Order in which items appear on invoices'
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
    modelName: 'FeeStructureItem',
    tableName: 'fee_structure_items',
    timestamps: true,
    indexes: [
        {
            fields: ['fee_structure_id']
        },
        {
            fields: ['category']
        }
    ]
});

// Define associations
FeeStructureItem.associate = (models) => {
    FeeStructureItem.belongsTo(models.FeeStructure, {
        foreignKey: 'fee_structure_id',
        as: 'feeStructure'
    });
};

// Instance method to calculate prorated amount
FeeStructureItem.prototype.calculateProratedAmount = function(daysRemaining, totalDays) {
    if (!this.is_recurring || this.payment_frequency === 'ONCE') {
        return this.amount;
    }
    return (this.amount * daysRemaining) / totalDays;
};

module.exports = FeeStructureItem;
