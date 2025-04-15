const express = require('express');
const router = express.Router();
const feeStructureController = require('../controllers/feeStructureController');
const { authenticate } = require('../middleware/auth');
const { validateFeeStructure } = require('../middleware/validations');

// Middleware to check admin/accountant role
const checkRole = (req, res, next) => {
    const allowedRoles = ['admin', 'accountant'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. You do not have permission to perform this action.'
        });
    }
    next();
};

// Create new fee structure
router.post(
    '/',
    authenticate,
    checkRole,
    validateFeeStructure,
    feeStructureController.createFeeStructure
);

// Get fee structure by ID
router.get(
    '/:id',
    authenticate,
    feeStructureController.getFeeStructure
);

// Get fee structure by class, term and academic year
router.get(
    '/by-class',
    authenticate,
    feeStructureController.getFeeStructureByClass
);

// Update fee structure
router.put(
    '/:id',
    authenticate,
    checkRole,
    validateFeeStructure,
    feeStructureController.updateFeeStructure
);

// Delete (deactivate) fee structure
router.delete(
    '/:id',
    authenticate,
    checkRole,
    feeStructureController.deleteFeeStructure
);

// Copy fee structure
router.post(
    '/:id/copy',
    authenticate,
    checkRole,
    feeStructureController.copyFeeStructure
);

// List fee structures with filtering and pagination
router.get(
    '/',
    authenticate,
    feeStructureController.listFeeStructures
);

// Bulk update fee items
router.put(
    '/:id/items',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { items } = req.body;
            
            // Validate items array
            if (!Array.isArray(items)) {
                return res.status(400).json({
                    error: 'Items must be an array'
                });
            }

            // Update items
            await feeStructureController.updateFeeItems(id, items, req.user.id);
            
            res.json({
                message: 'Fee items updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get fee structure statistics
router.get(
    '/statistics',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const stats = await feeStructureController.getStatistics(req.query);
            res.json({ data: stats });
        } catch (error) {
            next(error);
        }
    }
);

// Get fee categories
router.get(
    '/categories',
    authenticate,
    async (req, res) => {
        try {
            const categories = await feeStructureController.getFeeCategories();
            res.json({ data: categories });
        } catch (error) {
            next(error);
        }
    }
);

// Validate fee structure
router.post(
    '/validate',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const validation = await feeStructureController.validateStructure(req.body);
            res.json({ data: validation });
        } catch (error) {
            next(error);
        }
    }
);

// Compare fee structures
router.post(
    '/compare',
    authenticate,
    async (req, res) => {
        try {
            const { structureIds } = req.body;
            const comparison = await feeStructureController.compareStructures(structureIds);
            res.json({ data: comparison });
        } catch (error) {
            next(error);
        }
    }
);

// Get fee structure template
router.get(
    '/template',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const template = await feeStructureController.getTemplate(req.query.class);
            res.json({ data: template });
        } catch (error) {
            next(error);
        }
    }
);

// Import fee structure from Excel
router.post(
    '/import',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const result = await feeStructureController.importFromExcel(req.files.file);
            res.json({
                message: 'Fee structure imported successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
);

// Export fee structure to Excel
router.get(
    '/:id/export',
    authenticate,
    async (req, res) => {
        try {
            const buffer = await feeStructureController.exportToExcel(req.params.id);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=fee-structure.xlsx');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
