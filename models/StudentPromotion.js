const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class StudentPromotion extends Model {}

StudentPromotion.init({
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
    from_class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    to_class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    from_academic_year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    to_academic_year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    promotion_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'StudentPromotion',
    tableName: 'student_promotions',
    timestamps: true
});

module.exports = StudentPromotion;
