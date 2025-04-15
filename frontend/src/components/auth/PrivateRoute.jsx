import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const PrivateRoute = ({ 
    children, 
    requiredPermissions = [], 
    requiredRoles = [],
    redirectTo = '/login' 
}) => {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    // Check if user is authenticated
    if (!isAuthenticated) {
        toast.error('Please login to access this page');
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check if user must change password
    if (currentUser?.must_change_password && location.pathname !== '/change-password') {
        toast.warning('Please change your password to continue');
        return <Navigate to="/change-password" state={{ from: location }} replace />;
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
        const hasPermissions = authService.hasPermissions(requiredPermissions);
        if (!hasPermissions) {
            toast.error('You do not have permission to access this page');
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Check required roles
    if (requiredRoles.length > 0) {
        const hasRole = authService.hasRole(requiredRoles);
        if (!hasRole) {
            toast.error('You do not have the required role to access this page');
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default PrivateRoute;
