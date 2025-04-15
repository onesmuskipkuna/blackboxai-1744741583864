const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeeStructure extends Model {}

FeeStructure.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    class: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['pg', 'pp1', 'pp2', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6', 
                    'grade7', 'grade8', 'grade9', 'grade10']]
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
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
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
    modelName: 'FeeStructure',
    tableName: 'fee_structures',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['class', 'academic_year', 'term']
        }
    ]
});

module.exports = FeeStructure;
