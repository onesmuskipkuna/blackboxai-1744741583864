const { FeeStructure, FeeStructureItem, sequelize } = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class FeeStructureController {
    /**
     * Create a new fee structure with items
     */
    async createFeeStructure(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                class: className,
                academic_year,
                term,
                items,
                created_by
            } = req.body;

            // Check for existing fee structure
            const existingStructure = await FeeStructure.findOne({
                where: {
                    class: className,
                    academic_year,
                    term,
                    status: 'ACTIVE'
                }
            });

            if (existingStructure) {
                throw new BusinessError('Fee structure already exists for this class, term and academic year');
            }

            // Calculate total amount from items
            const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

            // Create fee structure
            const feeStructure = await FeeStructure.create({
                class: className,
                academic_year,
                term,
                total_amount: totalAmount,
                created_by,
                status: 'ACTIVE'
            }, { transaction });

            // Create fee items
            const feeItems = await Promise.all(
                items.map((item, index) => 
                    FeeStructureItem.create({
                        ...item,
                        fee_structure_id: feeStructure.id,
                        created_by,
                        display_order: index + 1
                    }, { transaction })
                )
            );

            await transaction.commit();

            // Log success
            logger.info('Fee structure created', {
                feeStructureId: feeStructure.id,
                class: className,
                academicYear: academic_year,
                term,
                itemCount: items.length
            });

            res.status(201).json({
                message: 'Fee structure created successfully',
                data: {
                    ...feeStructure.toJSON(),
                    items: feeItems
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get fee structure by ID with items
     */
    async getFeeStructure(req, res) {
        const { id } = req.params;

        const feeStructure = await FeeStructure.findOne({
            where: { id },
            include: [{
                model: FeeStructureItem,
                as: 'items',
                where: { status: 'ACTIVE' },
                order: [['display_order', 'ASC']]
            }]
        });

        if (!feeStructure) {
            throw new NotFoundError('Fee structure not found');
        }

        res.json({ data: feeStructure });
    }

    /**
     * Get fee structure for a specific class, term and academic year
     */
    async getFeeStructureByClass(req, res) {
        const { class: className, academic_year, term } = req.query;

        const feeStructure = await FeeStructure.findOne({
            where: {
                class: className,
                academic_year,
                term,
                status: 'ACTIVE'
            },
            include: [{
                model: FeeStructureItem,
                as: 'items',
                where: { status: 'ACTIVE' },
                order: [['display_order', 'ASC']]
            }]
        });

        if (!feeStructure) {
            throw new NotFoundError('Fee structure not found for the specified criteria');
        }

        res.json({ data: feeStructure });
    }

    /**
     * Update an existing fee structure
     */
    async updateFeeStructure(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const {
                items,
                updated_by
            } = req.body;

            const feeStructure = await FeeStructure.findByPk(id);
            if (!feeStructure) {
                throw new NotFoundError('Fee structure not found');
            }

            // Calculate new total amount
            const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

            // Update fee structure
            await feeStructure.update({
                total_amount: totalAmount,
                updated_by
            }, { transaction });

            // Update or create fee items
            for (const item of items) {
                if (item.id) {
                    // Update existing item
                    await FeeStructureItem.update({
                        ...item,
                        updated_by
                    }, {
                        where: { 
                            id: item.id,
                            fee_structure_id: id
                        },
                        transaction
                    });
                } else {
                    // Create new item
                    await FeeStructureItem.create({
                        ...item,
                        fee_structure_id: id,
                        created_by: updated_by
                    }, { transaction });
                }
            }

            await transaction.commit();

            // Fetch updated fee structure with items
            const updatedFeeStructure = await FeeStructure.findByPk(id, {
                include: [{
                    model: FeeStructureItem,
                    as: 'items',
                    where: { status: 'ACTIVE' },
                    order: [['display_order', 'ASC']]
                }]
            });

            logger.info('Fee structure updated', {
                feeStructureId: id,
                updatedBy: updated_by
            });

            res.json({
                message: 'Fee structure updated successfully',
                data: updatedFeeStructure
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete (deactivate) a fee structure
     */
    async deleteFeeStructure(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { updated_by } = req.body;

            const feeStructure = await FeeStructure.findByPk(id);
            if (!feeStructure) {
                throw new NotFoundError('Fee structure not found');
            }

            // Deactivate fee structure
            await feeStructure.update({
                status: 'INACTIVE',
                updated_by
            }, { transaction });

            // Deactivate all associated items
            await FeeStructureItem.update({
                status: 'INACTIVE',
                updated_by
            }, {
                where: { fee_structure_id: id },
                transaction
            });

            await transaction.commit();

            logger.info('Fee structure deleted', {
                feeStructureId: id,
                updatedBy: updated_by
            });

            res.json({
                message: 'Fee structure deleted successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Copy fee structure to create a new one
     */
    async copyFeeStructure(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { academic_year, term, created_by } = req.body;

            // Get source fee structure
            const sourceFeeStructure = await FeeStructure.findByPk(id, {
                include: [{
                    model: FeeStructureItem,
                    as: 'items',
                    where: { status: 'ACTIVE' }
                }]
            });

            if (!sourceFeeStructure) {
                throw new NotFoundError('Source fee structure not found');
            }

            // Check if target fee structure already exists
            const existingStructure = await FeeStructure.findOne({
                where: {
                    class: sourceFeeStructure.class,
                    academic_year,
                    term,
                    status: 'ACTIVE'
                }
            });

            if (existingStructure) {
                throw new BusinessError('Fee structure already exists for target academic year and term');
            }

            // Create new fee structure
            const newFeeStructure = await FeeStructure.create({
                class: sourceFeeStructure.class,
                academic_year,
                term,
                total_amount: sourceFeeStructure.total_amount,
                created_by,
                status: 'ACTIVE'
            }, { transaction });

            // Copy fee items
            await Promise.all(
                sourceFeeStructure.items.map(item =>
                    FeeStructureItem.create({
                        fee_structure_id: newFeeStructure.id,
                        item_name: item.item_name,
                        description: item.description,
                        amount: item.amount,
                        is_mandatory: item.is_mandatory,
                        is_recurring: item.is_recurring,
                        payment_frequency: item.payment_frequency,
                        due_date_offset: item.due_date_offset,
                        category: item.category,
                        display_order: item.display_order,
                        created_by
                    }, { transaction })
                )
            );

            await transaction.commit();

            logger.info('Fee structure copied', {
                sourceFeeStructureId: id,
                newFeeStructureId: newFeeStructure.id,
                academicYear: academic_year,
                term
            });

            res.status(201).json({
                message: 'Fee structure copied successfully',
                data: {
                    id: newFeeStructure.id
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get fee structures list with filtering and pagination
     */
    async listFeeStructures(req, res) {
        const {
            page = 1,
            limit = 10,
            class: className,
            academic_year,
            term,
            status = 'ACTIVE'
        } = req.query;

        const where = { status };
        if (className) where.class = className;
        if (academic_year) where.academic_year = academic_year;
        if (term) where.term = term;

        const feeStructures = await FeeStructure.findAndCountAll({
            where,
            include: [{
                model: FeeStructureItem,
                as: 'items',
                where: { status: 'ACTIVE' },
                required: false
            }],
            order: [
                ['academic_year', 'DESC'],
                ['term', 'ASC'],
                ['class', 'ASC']
            ],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            data: feeStructures.rows,
            pagination: {
                total: feeStructures.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(feeStructures.count / parseInt(limit))
            }
        });
    }
}

module.exports = new FeeStructureController();
