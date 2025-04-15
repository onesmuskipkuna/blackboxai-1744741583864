import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from '../contexts/UserContext';
import authRoutes, { renderAuthRoutes } from './authRoutes';
import { PrivateRoute } from '../components/auth';

const AppRoutes = () => {
    return (
        <UserProvider>
            <Routes>
                {/* Auth Routes */}
                {renderAuthRoutes(authRoutes)}

                {/* Protected Routes */}
                <Route
                    path="/dashboard/*"
                    element={
                        <PrivateRoute>
                            {/* <DashboardRoutes /> */}
                            <div>Dashboard Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Student Routes */}
                <Route
                    path="/students/*"
                    element={
                        <PrivateRoute requiredPermissions={['STUDENTS_VIEW']}>
                            {/* <StudentRoutes /> */}
                            <div>Student Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Employee Routes */}
                <Route
                    path="/employees/*"
                    element={
                        <PrivateRoute requiredPermissions={['EMPLOYEES_VIEW']}>
                            {/* <EmployeeRoutes /> */}
                            <div>Employee Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Fee Routes */}
                <Route
                    path="/fees/*"
                    element={
                        <PrivateRoute requiredPermissions={['FEES_VIEW']}>
                            {/* <FeeRoutes /> */}
                            <div>Fee Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Expense Routes */}
                <Route
                    path="/expenses/*"
                    element={
                        <PrivateRoute requiredPermissions={['EXPENSES_VIEW']}>
                            {/* <ExpenseRoutes /> */}
                            <div>Expense Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Payroll Routes */}
                <Route
                    path="/payroll/*"
                    element={
                        <PrivateRoute requiredPermissions={['PAYROLL_VIEW']}>
                            {/* <PayrollRoutes /> */}
                            <div>Payroll Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Report Routes */}
                <Route
                    path="/reports/*"
                    element={
                        <PrivateRoute requiredPermissions={['REPORTS_VIEW']}>
                            {/* <ReportRoutes /> */}
                            <div>Report Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Settings Routes */}
                <Route
                    path="/settings/*"
                    element={
                        <PrivateRoute requiredRoles={['admin']}>
                            {/* <SettingsRoutes /> */}
                            <div>Settings Routes (To be implemented)</div>
                        </PrivateRoute>
                    }
                />

                {/* Redirect root to login */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* 404 Route */}
                <Route
                    path="*"
                    element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <h1 className="text-6xl font-bold text-gray-900">404</h1>
                                <p className="mt-4 text-xl text-gray-600">Page not found</p>
                                <p className="mt-2 text-gray-500">
                                    The page you're looking for doesn't exist or has been moved.
                                </p>
                                <div className="mt-6 space-x-4">
                                    <button
                                        onClick={() => window.history.back()}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Go Back
                                    </button>
                                    <a
                                        href="/dashboard"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Go to Dashboard
                                    </a>
                                </div>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </UserProvider>
    );
};

export default AppRoutes;
