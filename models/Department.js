const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Department extends Model {}

Department.init({
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
            model: 'departments',
            key: 'id'
        }
    },
    head_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    budget_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contact_email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    contact_phone: {
        type: DataTypes.STRING,
        allowNull: true
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
    modelName: 'Department',
    tableName: 'departments',
    timestamps: true,
    hooks: {
        beforeCreate: async (department) => {
            // Generate department code if not provided
            if (!department.code) {
                const words = department.name.split(' ');
                let code = words.map(word => word[0].toUpperCase()).join('');
                
                // If code already exists, append a number
                let suffix = 1;
                let newCode = code;
                while (await Department.findOne({ where: { code: newCode } })) {
                    newCode = `${code}${suffix}`;
                    suffix++;
                }
                department.code = newCode;
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
            fields: ['head_employee_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Department.associate = (models) => {
    Department.belongsTo(Department, {
        foreignKey: 'parent_id',
        as: 'parent'
    });

    Department.hasMany(Department, {
        foreignKey: 'parent_id',
        as: 'subdepartments'
    });

    Department.belongsTo(models.Employee, {
        foreignKey: 'head_employee_id',
        as: 'departmentHead'
    });

    Department.hasMany(models.Employee, {
        foreignKey: 'department_id',
        as: 'employees'
    });

    Department.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Department.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Instance methods
Department.prototype.getEmployeeCount = async function() {
    return await sequelize.models.Employee.count({
        where: {
            department_id: this.id,
            status: 'ACTIVE'
        }
    });
};

Department.prototype.getSubdepartmentCount = async function() {
    return await Department.count({
        where: {
            parent_id: this.id,
            status: 'ACTIVE'
        }
    });
};

Department.prototype.getHierarchy = async function() {
    const hierarchy = [this];
    let current = this;
    
    while (current.parent_id) {
        current = await Department.findByPk(current.parent_id);
        if (current) {
            hierarchy.unshift(current);
        }
    }
    
    return hierarchy;
};

module.exports = Department;
