const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeeBalanceTransfer extends Model {}

FeeBalanceTransfer.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        }
    },
    from_term: {
        type: DataTypes.STRING,
        allowNull: false
    },
    to_term: {
        type: DataTypes.STRING,
        allowNull: false
    },
    from_class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    to_class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transfer_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    total_balance_transferred: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'TRANSFERRED', 'FAILED'),
        defaultValue: 'PENDING'
    }
}, {
    sequelize,
    modelName: 'FeeBalanceTransfer',
    tableName: 'fee_balance_transfers',
    timestamps: true
});

// Define associations
FeeBalanceTransfer.associate = (models) => {
    FeeBalanceTransfer.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
    });
    FeeBalanceTransfer.hasMany(models.FeeBalanceDetail, {
        foreignKey: 'balance_transfer_id',
        as: 'balanceDetails'
    });
};

module.exports = FeeBalanceTransfer;
