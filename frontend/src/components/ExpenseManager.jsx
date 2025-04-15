import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import expenseService from '../services/expenseService';
import { formatAmount, formatDate } from '../utils/academicUtils';

const ExpenseManager = () => {
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [filters, setFilters] = useState({
        category_id: '',
        vendor_id: '',
        status: '',
        start_date: '',
        end_date: '',
        min_amount: '',
        max_amount: ''
    });
    const [expenseData, setExpenseData] = useState({
        category_id: '',
        title: '',
        description: '',
        amount: '',
        tax_amount: '0',
        expense_date: new Date().toISOString().split('T')[0],
        payment_mode: 'CASH',
        vendor_id: '',
        attachments: []
    });

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
        fetchVendors();
    }, [filters]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await expenseService.listExpenses(filters);
            setExpenses(response.data);
        } catch (error) {
            toast.error('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await expenseService.listCategories();
            setCategories(response.data);
        } catch (error) {
            toast.error('Failed to fetch categories');
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await expenseService.listVendors();
            setVendors(response.data);
        } catch (error) {
            toast.error('Failed to fetch vendors');
        }
    };

    const handleFileChange = (e) => {
        setExpenseData(prev => ({
            ...prev,
            attachments: Array.from(e.target.files)
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (selectedExpense) {
                await expenseService.updateExpense(
                    selectedExpense.id,
                    expenseData,
                    expenseData.attachments
                );
                toast.success('Expense updated successfully');
            } else {
                await expenseService.createExpense(expenseData, expenseData.attachments);
                toast.success('Expense created successfully');
            }
            setShowExpenseModal(false);
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setLoading(true);
            await expenseService.approveExpense(id);
            toast.success('Expense approved successfully');
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        const reason = window.prompt('Please enter cancellation reason:');
        if (!reason) return;

        try {
            setLoading(true);
            await expenseService.cancelExpense(id, reason);
            toast.success('Expense cancelled successfully');
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadAttachment = async (attachmentId) => {
        try {
            const blob = await expenseService.downloadAttachment(attachmentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attachment-${attachmentId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download attachment');
        }
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                    alt="Expense Management Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Expense Management</h2>
                    <button
                        onClick={() => {
                            setSelectedExpense(null);
                            setExpenseData({
                                category_id: '',
                                title: '',
                                description: '',
                                amount: '',
                                tax_amount: '0',
                                expense_date: new Date().toISOString().split('T')[0],
                                payment_mode: 'CASH',
                                vendor_id: '',
                                attachments: []
                            });
                            setShowExpenseModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        New Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Category
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.category_id}
                            onChange={(e) => setFilters({...filters, category_id: e.target.value})}
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Vendor
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.vendor_id}
                            onChange={(e) => setFilters({...filters, vendor_id: e.target.value})}
                        >
                            <option value="">All Vendors</option>
                            {vendors.map(vendor => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="">All Statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PENDING_APPROVAL">Pending Approval</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.end_date}
                            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Amount Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={filters.min_amount}
                                onChange={(e) => setFilters({...filters, min_amount: e.target.value})}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={filters.max_amount}
                                onChange={(e) => setFilters({...filters, max_amount: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map((expense) => (
                                <tr key={expense.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {expense.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {expense.category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(expense.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(expense.expense_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full
                                            ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                              expense.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                                              expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                              expense.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                                              'bg-blue-100 text-blue-800'}`}>
                                            {expense.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedExpense(expense);
                                                setExpenseData({
                                                    ...expense,
                                                    attachments: []
                                                });
                                                setShowExpenseModal(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 mr-2"
                                        >
                                            Edit
                                        </button>
                                        {expense.status === 'PENDING_APPROVAL' && (
                                            <button
                                                onClick={() => handleApprove(expense.id)}
                                                className="text-green-500 hover:text-green-700 mr-2"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {['DRAFT', 'PENDING_APPROVAL'].includes(expense.status) && (
                                            <button
                                                onClick={() => handleCancel(expense.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedExpense ? 'Edit Expense' : 'New Expense'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={expenseData.category_id}
                                    onChange={(e) => setExpenseData({
                                        ...expenseData,
                                        category_id: e.target.value
                                    })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={expenseData.title}
                                    onChange={(e) => setExpenseData({
                                        ...expenseData,
                                        title: e.target.value
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={expenseData.description}
                                    onChange={(e) => setExpenseData({
                                        ...expenseData,
                                        description: e.target.value
                                    })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={expenseData.amount}
                                        onChange={(e) => setExpenseData({
                                            ...expenseData,
                                            amount: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tax Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={expenseData.tax_amount}
                                        onChange={(e) => setExpenseData({
                                            ...expenseData,
                                            tax_amount: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Expense Date
                                    </label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={expenseData.expense_date}
                                        onChange={(e) => setExpenseData({
                                            ...expenseData,
                                            expense_date: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Payment Mode
                                    </label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={expenseData.payment_mode}
                                        onChange={(e) => setExpenseData({
                                            ...expenseData,
                                            payment_mode: e.target.value
                                        })}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="CREDIT_CARD">Credit Card</option>
                                        <option value="DEBIT_CARD">Debit Card</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Vendor
                                </label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={expenseData.vendor_id}
                                    onChange={(e) => setExpenseData({
                                        ...expenseData,
                                        vendor_id: e.target.value
                                    })}
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map(vendor => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Attachments
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    className="mt-1 block w-full"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {selectedExpense?.attachments?.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Existing Attachments
                                    </label>
                                    <div className="mt-1 space-y-2">
                                        {selectedExpense.attachments.map(attachment => (
                                            <div key={attachment.id} className="flex items-center justify-between">
                                                <span>{attachment.original_name}</span>
                                                <button
                                                    onClick={() => downloadAttachment(attachment.id)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setShowExpenseModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {loading ? 'Processing...' : selectedExpense ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManager;
