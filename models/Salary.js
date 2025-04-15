const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Salary extends Model {}

Salary.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    salary_month: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Month for which salary is being processed'
    },
    basic_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
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
    gross_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    net_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    days_worked: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    leaves_taken: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing leave types and days'
    },
    overtime_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    overtime_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    overtime_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    bonus: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    bonus_description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tax_deductions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing tax breakup'
    },
    pf_employee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    pf_employer: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    esi_employee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    esi_employer: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    professional_tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    other_deductions: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    loan_deductions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing loan deduction details'
    },
    reimbursements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object containing reimbursement details'
    },
    payment_mode: {
        type: DataTypes.ENUM(
            'BANK_TRANSFER',
            'CHEQUE',
            'CASH'
        ),
        defaultValue: 'BANK_TRANSFER'
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_reference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            'DRAFT',
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'PAID',
            'CANCELLED'
        ),
        defaultValue: 'DRAFT'
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
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    comments: {
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
    }
}, {
    sequelize,
    modelName: 'Salary',
    tableName: 'salaries',
    timestamps: true,
    hooks: {
        beforeCreate: async (salary) => {
            // Calculate gross salary
            let grossSalary = parseFloat(salary.basic_salary);
            
            // Add allowances
            if (salary.allowances) {
                grossSalary += Object.values(salary.allowances)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);
            }

            // Add overtime
            if (salary.overtime_amount) {
                grossSalary += parseFloat(salary.overtime_amount);
            }

            // Add bonus
            if (salary.bonus) {
                grossSalary += parseFloat(salary.bonus);
            }

            // Add reimbursements
            if (salary.reimbursements) {
                grossSalary += Object.values(salary.reimbursements)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);
            }

            salary.gross_salary = grossSalary;

            // Calculate deductions
            let totalDeductions = 0;

            // Standard deductions
            if (salary.deductions) {
                totalDeductions += Object.values(salary.deductions)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);
            }

            // Tax deductions
            if (salary.tax_deductions) {
                totalDeductions += Object.values(salary.tax_deductions)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);
            }

            // PF and ESI
            totalDeductions += parseFloat(salary.pf_employee || 0);
            totalDeductions += parseFloat(salary.esi_employee || 0);
            totalDeductions += parseFloat(salary.professional_tax || 0);
            totalDeductions += parseFloat(salary.other_deductions || 0);

            // Loan deductions
            if (salary.loan_deductions) {
                totalDeductions += Object.values(salary.loan_deductions)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);
            }

            // Calculate net salary
            salary.net_salary = grossSalary - totalDeductions;
        }
    },
    indexes: [
        {
            fields: ['employee_id']
        },
        {
            fields: ['salary_month']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Salary.associate = (models) => {
    Salary.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
    });

    Salary.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
    });

    Salary.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Salary.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });
};

// Instance methods
Salary.prototype.approve = async function(userId) {
    await this.update({
        status: 'APPROVED',
        approved_by: userId,
        approval_date: new Date()
    });
};

Salary.prototype.reject = async function(userId, reason) {
    await this.update({
        status: 'REJECTED',
        rejection_reason: reason,
        updated_by: userId
    });
};

Salary.prototype.markAsPaid = async function(userId, paymentDetails) {
    await this.update({
        status: 'PAID',
        payment_date: new Date(),
        payment_reference: paymentDetails.reference,
        updated_by: userId,
        ...paymentDetails
    });
};

Salary.prototype.generatePayslip = function() {
    // Return formatted payslip data
    return {
        employee: this.employee,
        salary_month: this.salary_month,
        basic_salary: this.basic_salary,
        allowances: this.allowances,
        deductions: this.deductions,
        gross_salary: this.gross_salary,
        net_salary: this.net_salary,
        payment_details: {
            mode: this.payment_mode,
            bank: this.bank_name,
            account: this.bank_account_number,
            reference: this.payment_reference,
            date: this.payment_date
        }
    };
};

module.exports = Salary;
