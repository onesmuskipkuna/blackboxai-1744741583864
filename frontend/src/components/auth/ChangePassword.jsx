import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = () => {
        const { new_password, confirm_password } = formData;

        if (new_password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return false;
        }

        if (!/(?=.*[a-z])/.test(new_password)) {
            toast.error('Password must contain at least one lowercase letter');
            return false;
        }

        if (!/(?=.*[A-Z])/.test(new_password)) {
            toast.error('Password must contain at least one uppercase letter');
            return false;
        }

        if (!/(?=.*\d)/.test(new_password)) {
            toast.error('Password must contain at least one number');
            return false;
        }

        if (!/(?=.*[@$!%*?&])/.test(new_password)) {
            toast.error('Password must contain at least one special character');
            return false;
        }

        if (new_password !== confirm_password) {
            toast.error('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword()) {
            return;
        }

        try {
            setLoading(true);
            await authService.changePassword(formData);
            toast.success('Password changed successfully');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Change Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Please enter your current password and choose a new password
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="current_password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Current Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="current_password"
                                    name="current_password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="new_password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="new_password"
                                    name="new_password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirm_password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Confirm New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Password Security Tips
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-sm text-gray-500">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Use a unique password that you don't use elsewhere</li>
                                <li>Avoid using personal information in your password</li>
                                <li>Consider using a password manager</li>
                                <li>Change your password regularly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
