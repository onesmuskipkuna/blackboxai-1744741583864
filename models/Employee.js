const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class Employee extends Model {}

Employee.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [10, 15]
        }
    },
    date_of_birth: {
        type: DataTypes.DATE,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: false
    },
    marital_status: {
        type: DataTypes.ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'),
        allowNull: true
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    designation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'designations',
            key: 'id'
        }
    },
    joining_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    confirmation_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    contract_end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    employment_status: {
        type: DataTypes.ENUM(
            'PROBATION',
            'PERMANENT',
            'CONTRACT',
            'NOTICE_PERIOD',
            'RESIGNED',
            'TERMINATED'
        ),
        defaultValue: 'PROBATION'
    },
    employment_type: {
        type: DataTypes.ENUM(
            'FULL_TIME',
            'PART_TIME',
            'TEMPORARY',
            'INTERN'
        ),
        allowNull: false
    },
    basic_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    salary_currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR'
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_ifsc_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pan_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [10, 10]
        }
    },
    uan_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pf_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    esi_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address_line1: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address_line2: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emergency_contact_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emergency_contact_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emergency_contact_relation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blood_group: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reporting_manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    leave_balance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing leave type and balance'
    },
    allowances: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing allowance types and amounts'
    },
    deductions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing deduction types and amounts'
    },
    tax_declarations: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing tax declaration details'
    },
    qualifications: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of qualification objects'
    },
    experience: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of previous experience objects'
    },
    documents: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of document objects'
    },
    skills: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of skill objects'
    },
    certifications: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of certification objects'
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    },
    last_working_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resignation_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    termination_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    termination_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notice_period_days: {
        type: DataTypes.INTEGER,
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
    }
}, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    hooks: {
        beforeCreate: async (employee) => {
            // Generate employee code if not provided
            if (!employee.employee_code) {
                const prefix = 'EMP';
                const year = new Date().getFullYear().toString().substr(-2);
                
                // Get the last employee code
                const lastEmployee = await Employee.findOne({
                    where: {
                        employee_code: {
                            [Op.like]: `${prefix}${year}%`
                        }
                    },
                    order: [['employee_code', 'DESC']]
                });

                let sequence = '0001';
                if (lastEmployee) {
                    const lastSequence = parseInt(lastEmployee.employee_code.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                employee.employee_code = `${prefix}${year}${sequence}`;
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['employee_code']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            fields: ['department_id']
        },
        {
            fields: ['designation_id']
        },
        {
            fields: ['employment_status']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Employee.associate = (models) => {
    Employee.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
    });

    Employee.belongsTo(models.Designation, {
        foreignKey: 'designation_id',
        as: 'designation'
    });

    Employee.belongsTo(Employee, {
        foreignKey: 'reporting_manager_id',
        as: 'reportingManager'
    });

    Employee.hasMany(Employee, {
        foreignKey: 'reporting_manager_id',
        as: 'reportees'
    });

    Employee.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Employee.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });

    Employee.hasMany(models.Salary, {
        foreignKey: 'employee_id',
        as: 'salaries'
    });

    Employee.hasMany(models.Leave, {
        foreignKey: 'employee_id',
        as: 'leaves'
    });

    Employee.hasMany(models.Attendance, {
        foreignKey: 'employee_id',
        as: 'attendance'
    });
};

// Instance methods
Employee.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

Employee.prototype.getCurrentSalary = async function() {
    const salary = await sequelize.models.Salary.findOne({
        where: { employee_id: this.id },
        order: [['effective_date', 'DESC']]
    });
    return salary;
};

Employee.prototype.getLeaveBalance = async function(leaveType) {
    if (!this.leave_balance) return 0;
    return this.leave_balance[leaveType] || 0;
};

Employee.prototype.updateLeaveBalance = async function(leaveType, days) {
    const balance = this.leave_balance || {};
    balance[leaveType] = (balance[leaveType] || 0) + days;
    await this.update({ leave_balance: balance });
};

module.exports = Employee;
