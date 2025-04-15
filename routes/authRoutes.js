const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLogin, validatePasswordChange, validatePasswordReset } = require('../middleware/authValidations');

// Public routes
router.post(
    '/login',
    validateLogin,
    authController.login
);

router.post(
    '/request-password-reset',
    authController.requestPasswordReset
);

router.post(
    '/reset-password',
    validatePasswordReset,
    authController.resetPassword
);

// Protected routes
router.post(
    '/logout',
    authenticate,
    authController.logout
);

router.post(
    '/change-password',
    authenticate,
    validatePasswordChange,
    authController.changePassword
);

router.get(
    '/profile',
    authenticate,
    authController.getProfile
);

router.put(
    '/profile',
    authenticate,
    authController.updateProfile
);

module.exports = router;
