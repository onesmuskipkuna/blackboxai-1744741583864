export { default as Login } from './Login';
export { default as ForgotPassword } from './ForgotPassword';
export { default as ResetPassword } from './ResetPassword';
export { default as ChangePassword } from './ChangePassword';
export { default as PrivateRoute } from './PrivateRoute';
export { default as AuthLayout } from './AuthLayout';

// Auth-related constants
export const AUTH_ROUTES = {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token',
    CHANGE_PASSWORD: '/change-password'
};

// Permission constants
export const PERMISSIONS = {
    // User Management
    USER_VIEW: 'USERS_VIEW',
    USER_CREATE: 'USERS_CREATE',
    USER_UPDATE: 'USERS_UPDATE',
    USER_DELETE: 'USERS_DELETE',

    // Role Management
    ROLE_VIEW: 'ROLES_VIEW',
    ROLE_CREATE: 'ROLES_CREATE',
    ROLE_UPDATE: 'ROLES_UPDATE',
    ROLE_DELETE: 'ROLES_DELETE',

    // Student Management
    STUDENT_VIEW: 'STUDENTS_VIEW',
    STUDENT_CREATE: 'STUDENTS_CREATE',
    STUDENT_UPDATE: 'STUDENTS_UPDATE',
    STUDENT_DELETE: 'STUDENTS_DELETE',

    // Employee Management
    EMPLOYEE_VIEW: 'EMPLOYEES_VIEW',
    EMPLOYEE_CREATE: 'EMPLOYEES_CREATE',
    EMPLOYEE_UPDATE: 'EMPLOYEES_UPDATE',
    EMPLOYEE_DELETE: 'EMPLOYEES_DELETE',

    // Fee Management
    FEE_VIEW: 'FEES_VIEW',
    FEE_CREATE: 'FEES_CREATE',
    FEE_UPDATE: 'FEES_UPDATE',
    FEE_DELETE: 'FEES_DELETE',

    // Expense Management
    EXPENSE_VIEW: 'EXPENSES_VIEW',
    EXPENSE_CREATE: 'EXPENSES_CREATE',
    EXPENSE_UPDATE: 'EXPENSES_UPDATE',
    EXPENSE_DELETE: 'EXPENSES_DELETE',
    EXPENSE_APPROVE: 'EXPENSES_APPROVE',

    // Payroll Management
    PAYROLL_VIEW: 'PAYROLL_VIEW',
    PAYROLL_CREATE: 'PAYROLL_CREATE',
    PAYROLL_UPDATE: 'PAYROLL_UPDATE',
    PAYROLL_DELETE: 'PAYROLL_DELETE',
    PAYROLL_PROCESS: 'PAYROLL_PROCESS',

    // Report Management
    REPORT_VIEW: 'REPORTS_VIEW',
    REPORT_GENERATE: 'REPORTS_GENERATE'
};

// Role constants
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    ACCOUNTANT: 'accountant',
    HR: 'hr',
    TEACHER: 'teacher',
    STAFF: 'staff'
};

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.ROLE_VIEW,
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.FEE_VIEW,
        PERMISSIONS.EXPENSE_VIEW,
        PERMISSIONS.EXPENSE_APPROVE,
        PERMISSIONS.PAYROLL_VIEW,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_GENERATE
    ],
    [ROLES.ACCOUNTANT]: [
        PERMISSIONS.FEE_VIEW,
        PERMISSIONS.FEE_CREATE,
        PERMISSIONS.FEE_UPDATE,
        PERMISSIONS.EXPENSE_VIEW,
        PERMISSIONS.EXPENSE_CREATE,
        PERMISSIONS.EXPENSE_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_GENERATE
    ],
    [ROLES.HR]: [
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.EMPLOYEE_CREATE,
        PERMISSIONS.EMPLOYEE_UPDATE,
        PERMISSIONS.PAYROLL_VIEW,
        PERMISSIONS.PAYROLL_CREATE,
        PERMISSIONS.PAYROLL_PROCESS,
        PERMISSIONS.REPORT_VIEW
    ],
    [ROLES.TEACHER]: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.STUDENT_UPDATE
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.STUDENT_VIEW
    ]
};

// Authentication status messages
export const AUTH_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Invalid email or password',
    LOGOUT_SUCCESS: 'Logout successful',
    PASSWORD_CHANGED: 'Password changed successfully',
    PASSWORD_RESET_SENT: 'Password reset instructions have been sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
    SESSION_EXPIRED: 'Your session has expired. Please login again',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    PERMISSION_DENIED: 'You do not have permission to perform this action'
};
