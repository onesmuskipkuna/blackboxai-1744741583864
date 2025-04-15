import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { AUTH_MESSAGES } from '../components/auth';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Initialize user state from local storage
    useEffect(() => {
        const initializeAuth = () => {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            }
            setLoading(false);
            setInitialized(true);
        };

        initializeAuth();
    }, []);

    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await authService.login(credentials);
            setUser(response.data.user);
            toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || AUTH_MESSAGES.LOGIN_FAILED);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
            toast.success(AUTH_MESSAGES.LOGOUT_SUCCESS);
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
            // Still clear user state even if API call fails
            setUser(null);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (userData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...userData
        }));
    };

    const checkPermission = (permission) => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    };

    const checkRole = (roles) => {
        if (!user || !user.role) return false;
        return Array.isArray(roles) 
            ? roles.includes(user.role)
            : user.role === roles;
    };

    // Handle session expiration
    useEffect(() => {
        const handleUnauthorized = (error) => {
            if (error.response?.status === 401) {
                setUser(null);
                toast.error(AUTH_MESSAGES.SESSION_EXPIRED);
                navigate('/login');
            }
        };

        // Add global axios interceptor
        const interceptor = authService.setupAxiosInterceptors(handleUnauthorized);

        return () => {
            // Remove interceptor on cleanup
            if (interceptor) {
                interceptor();
            }
        };
    }, [navigate]);

    const value = {
        user,
        loading,
        initialized,
        login,
        logout,
        updateUser,
        checkPermission,
        checkRole
    };

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// Custom hooks for permission and role checks
export const usePermission = (permission) => {
    const { checkPermission } = useUser();
    return checkPermission(permission);
};

export const useRole = (roles) => {
    const { checkRole } = useUser();
    return checkRole(roles);
};

// HOC for permission-based component rendering
export const withPermission = (WrappedComponent, requiredPermission) => {
    return function WithPermissionComponent(props) {
        const hasPermission = usePermission(requiredPermission);
        
        if (!hasPermission) {
            return null;
        }
        
        return <WrappedComponent {...props} />;
    };
};

// HOC for role-based component rendering
export const withRole = (WrappedComponent, requiredRoles) => {
    return function WithRoleComponent(props) {
        const hasRole = useRole(requiredRoles);
        
        if (!hasRole) {
            return null;
        }
        
        return <WrappedComponent {...props} />;
    };
};

export default UserContext;
