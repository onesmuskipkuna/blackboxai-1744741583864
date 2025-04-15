import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <img
                        src="https://via.placeholder.com/150"
                        alt="School Logo"
                        className="h-8 w-auto"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white shadow mt-8">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-sm text-gray-500">
                        <p>© {new Date().getFullYear()} Your School Name. All rights reserved.</p>
                        <p className="mt-1">
                            <a href="/privacy-policy" className="text-blue-600 hover:text-blue-500">
                                Privacy Policy
                            </a>
                            {' · '}
                            <a href="/terms-of-service" className="text-blue-600 hover:text-blue-500">
                                Terms of Service
                            </a>
                            {' · '}
                            <a href="/contact-support" className="text-blue-600 hover:text-blue-500">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AuthLayout;
