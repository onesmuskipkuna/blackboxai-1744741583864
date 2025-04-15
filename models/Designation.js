const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Designation extends Model {}

Designation.init({
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
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    grade_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Hierarchical level of the designation'
    },
    reporting_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'designations',
            key: 'id'
        },
        comment: 'Designation that this position reports to'
    },
    min_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    max_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    responsibilities: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of key responsibilities'
    },
    qualifications: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Required qualifications and skills'
    },
    benefits: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Special benefits for this designation'
    },
    probation_period: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Probation period in months'
    },
    notice_period: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Notice period in days'
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
    modelName: 'Designation',
    tableName: 'designations',
    timestamps: true,
    hooks: {
        beforeCreate: async (designation) => {
            // Generate designation code if not provided
            if (!designation.code) {
                const words = designation.name.split(' ');
                let code = words.map(word => word[0].toUpperCase()).join('');
                
                // If code already exists, append a number
                let suffix = 1;
                let newCode = code;
                while (await Designation.findOne({ where: { code: newCode } })) {
                    newCode = `${code}${suffix}`;
                    suffix++;
                }
                designation.code = newCode;
            }

            // Validate salary range
            if (designation.min_salary && designation.max_salary) {
                if (parseFloat(designation.min_salary) > parseFloat(designation.max_salary)) {
                    throw new Error('Minimum salary cannot be greater than maximum salary');
                }
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
            fields: ['department_id']
        },
        {
            fields: ['grade_level']
        },
        {
            fields: ['reporting_to']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Designation.associate = (models) => {
    Designation.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
    });

    Designation.belongsTo(Designation, {
        foreignKey: 'reporting_to',
        as: 'reportingDesignation'
    });

    Designation.hasMany(Designation, {
        foreignKey: 'reporting_to',
        as: 'subordinateDesignations'
    });

    Designation.hasMany(models.Employee, {
        foreignKey: 'designation_id',
        as: 'employees'
    });

    Designation.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Designation.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Instance methods
Designation.prototype.getEmployeeCount = async function() {
    return await sequelize.models.Employee.count({
        where: {
            designation_id: this.id,
            status: 'ACTIVE'
        }
    });
};

Designation.prototype.getReportingHierarchy = async function() {
    const hierarchy = [this];
    let current = this;
    
    while (current.reporting_to) {
        current = await Designation.findByPk(current.reporting_to);
        if (current) {
            hierarchy.unshift(current);
        }
    }
    
    return hierarchy;
};

Designation.prototype.getSubordinateDesignations = async function() {
    return await Designation.findAll({
        where: {
            reporting_to: this.id,
            status: 'ACTIVE'
        }
    });
};

module.exports = Designation;
