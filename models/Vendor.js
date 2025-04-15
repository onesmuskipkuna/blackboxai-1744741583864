const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Vendor extends Model {}

Vendor.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vendor_code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    contact_person: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
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
    alternate_phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [10, 15]
        }
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
    tax_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'GST/VAT/Tax identification number'
    },
    pan_number: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'PAN Card number'
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ifsc_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_terms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Payment terms in days'
    },
    credit_limit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    category_ids: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of expense category IDs this vendor is associated with'
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED'),
        defaultValue: 'ACTIVE'
    },
    blacklist_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
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
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional vendor-specific metadata'
    },
    total_expenses: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Total amount of expenses with this vendor'
    },
    last_expense_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    documents_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verification_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    verified_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Vendor',
    tableName: 'vendors',
    timestamps: true,
    hooks: {
        beforeCreate: async (vendor) => {
            // Generate vendor code if not provided
            if (!vendor.vendor_code) {
                const prefix = 'VEN';
                const year = new Date().getFullYear().toString().substr(-2);
                
                // Get the last vendor code
                const lastVendor = await Vendor.findOne({
                    where: {
                        vendor_code: {
                            [Op.like]: `${prefix}${year}%`
                        }
                    },
                    order: [['vendor_code', 'DESC']]
                });

                let sequence = '0001';
                if (lastVendor) {
                    const lastSequence = parseInt(lastVendor.vendor_code.slice(-4));
                    sequence = (lastSequence + 1).toString().padStart(4, '0');
                }

                vendor.vendor_code = `${prefix}${year}${sequence}`;
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['vendor_code']
        },
        {
            fields: ['name']
        },
        {
            fields: ['status']
        }
    ]
});

// Define associations
Vendor.associate = (models) => {
    Vendor.hasMany(models.Expense, {
        foreignKey: 'vendor_id',
        as: 'expenses'
    });

    Vendor.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
    });

    Vendor.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
    });

    Vendor.belongsTo(models.User, {
        foreignKey: 'verified_by',
        as: 'verifier'
    });
};

// Instance methods
Vendor.prototype.blacklist = async function(reason, userId) {
    await this.update({
        status: 'BLACKLISTED',
        blacklist_reason: reason,
        updated_by: userId
    });
};

Vendor.prototype.verify = async function(userId) {
    await this.update({
        documents_verified: true,
        verification_date: new Date(),
        verified_by: userId
    });
};

Vendor.prototype.updateTotalExpenses = async function() {
    const result = await sequelize.models.Expense.findOne({
        where: {
            vendor_id: this.id,
            status: 'APPROVED'
        },
        attributes: [
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
            [sequelize.fn('MAX', sequelize.col('expense_date')), 'last_date']
        ]
    });

    await this.update({
        total_expenses: result.getDataValue('total') || 0,
        last_expense_date: result.getDataValue('last_date')
    });
};

Vendor.prototype.isOverCreditLimit = function(amount) {
    if (!this.credit_limit) return false;
    return (parseFloat(this.total_expenses) + parseFloat(amount)) > this.credit_limit;
};

// Static methods
Vendor.getTopVendors = async function(limit = 10) {
    return await this.findAll({
        where: { status: 'ACTIVE' },
        order: [['total_expenses', 'DESC']],
        limit
    });
};

module.exports = Vendor;
