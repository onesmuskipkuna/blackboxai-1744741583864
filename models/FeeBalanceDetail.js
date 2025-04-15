const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeeBalanceDetail extends Model {}

FeeBalanceDetail.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    balance_transfer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'fee_balance_transfers',
            key: 'id'
        }
    },
    fee_item_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    original_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
    term: {
        type: DataTypes.STRING,
        allowNull: false
    },
    academic_year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    carried_forward_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'FeeBalanceDetail',
    tableName: 'fee_balance_details',
    timestamps: true,
    indexes: [
        {
            fields: ['balance_transfer_id']
        }
    ]
});

// Define associations
FeeBalanceDetail.associate = (models) => {
    FeeBalanceDetail.belongsTo(models.FeeBalanceTransfer, {
        foreignKey: 'balance_transfer_id',
        as: 'balanceTransfer'
    });
};

module.exports = FeeBalanceDetail;
