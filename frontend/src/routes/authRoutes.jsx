import React from 'react';
import { Route } from 'react-router-dom';
import {
    Login,
    ForgotPassword,
    ResetPassword,
    ChangePassword,
    AuthLayout,
    PrivateRoute,
    AUTH_ROUTES
} from '../components/auth';

const authRoutes = [
    {
        path: '/',
        element: <AuthLayout />,
        children: [
            // Public routes
            {
                path: AUTH_ROUTES.LOGIN,
                element: <Login />
            },
            {
                path: AUTH_ROUTES.FORGOT_PASSWORD,
                element: <ForgotPassword />
            },
            {
                path: AUTH_ROUTES.RESET_PASSWORD,
                element: <ResetPassword />
            },
            // Protected routes
            {
                path: AUTH_ROUTES.CHANGE_PASSWORD,
                element: (
                    <PrivateRoute>
                        <ChangePassword />
                    </PrivateRoute>
                )
            }
        ]
    }
];

// Helper function to generate Route components
export const renderAuthRoutes = (routes) => {
    return routes.map((route) => {
        if (route.children) {
            return (
                <Route key={route.path} path={route.path} element={route.element}>
                    {renderAuthRoutes(route.children)}
                </Route>
            );
        }
        return (
            <Route
                key={route.path}
                path={route.path}
                element={route.element}
            />
        );
    });
};

export default authRoutes;
