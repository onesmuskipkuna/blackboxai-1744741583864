import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import expenseService from '../services/expenseService';
import { formatAmount, formatDate } from '../utils/academicUtils';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const BudgetManager = () => {
    const [loading, setLoading] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [filters, setFilters] = useState({
        academic_year: '',
        type: '',
        status: ''
    });
    const [budgetData, setBudgetData] = useState({
        title: '',
        description: '',
        academic_year: '',
        start_date: '',
        end_date: '',
        total_amount: '',
        type: 'ANNUAL',
        category_allocations: {},
        warning_threshold: '',
        freeze_threshold: '',
        approval_required: false
    });
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchBudgets();
        fetchCategories();
    }, [filters]);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await expenseService.listBudgets(filters);
            setBudgets(response.data);
            prepareChartData(response.data);
        } catch (error) {
            toast.error('Failed to fetch budgets');
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

    const prepareChartData = (budgets) => {
        // Utilization by type
        const typeData = {
            labels: ['Annual', 'Term', 'Monthly', 'Project', 'Special'],
            datasets: [{
                data: [
                    budgets.filter(b => b.type === 'ANNUAL').reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0),
                    budgets.filter(b => b.type === 'TERM').reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0),
                    budgets.filter(b => b.type === 'MONTHLY').reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0),
                    budgets.filter(b => b.type === 'PROJECT').reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0),
                    budgets.filter(b => b.type === 'SPECIAL').reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0)
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ]
            }]
        };

        // Status distribution
        const statusData = {
            labels: ['Active', 'Draft', 'Closed', 'Cancelled'],
            datasets: [{
                data: [
                    budgets.filter(b => b.status === 'ACTIVE').length,
                    budgets.filter(b => b.status === 'DRAFT').length,
                    budgets.filter(b => b.status === 'CLOSED').length,
                    budgets.filter(b => b.status === 'CANCELLED').length
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ]
            }]
        };

        // Monthly allocation vs utilization
        const monthlyData = {
            labels: budgets
                .filter(b => b.status === 'ACTIVE')
                .map(b => b.title),
            datasets: [
                {
                    label: 'Allocated',
                    data: budgets
                        .filter(b => b.status === 'ACTIVE')
                        .map(b => b.total_amount),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: 'Utilized',
                    data: budgets
                        .filter(b => b.status === 'ACTIVE')
                        .map(b => b.utilized_amount),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }
            ]
        };

        setChartData({ typeData, statusData, monthlyData });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (selectedBudget) {
                await expenseService.updateBudget(selectedBudget.id, budgetData);
                toast.success('Budget updated successfully');
            } else {
                await expenseService.createBudget(budgetData);
                toast.success('Budget created successfully');
            }
            setShowBudgetModal(false);
            fetchBudgets();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setLoading(true);
            await expenseService.approveBudget(id);
            toast.success('Budget approved successfully');
            fetchBudgets();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async (id) => {
        const notes = window.prompt('Please enter closure notes:');
        if (!notes) return;

        try {
            setLoading(true);
            await expenseService.closeBudget(id, notes);
            toast.success('Budget closed successfully');
            fetchBudgets();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryAllocationChange = (categoryId, amount) => {
        setBudgetData(prev => ({
            ...prev,
            category_allocations: {
                ...prev.category_allocations,
                [categoryId]: parseFloat(amount) || 0
            }
        }));
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                    alt="Budget Management Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Budget Management</h2>
                    <button
                        onClick={() => {
                            setSelectedBudget(null);
                            setBudgetData({
                                title: '',
                                description: '',
                                academic_year: '',
                                start_date: '',
                                end_date: '',
                                total_amount: '',
                                type: 'ANNUAL',
                                category_allocations: {},
                                warning_threshold: '',
                                freeze_threshold: '',
                                approval_required: false
                            });
                            setShowBudgetModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        New Budget
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Budget</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {formatAmount(budgets.reduce((sum, b) => sum + parseFloat(b.total_amount), 0))}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Utilized</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {formatAmount(budgets.reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0))}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Active Budgets</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {budgets.filter(b => b.status === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Utilization Rate</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {Math.round((budgets.reduce((sum, b) => sum + parseFloat(b.utilized_amount), 0) /
                            budgets.reduce((sum, b) => sum + parseFloat(b.total_amount), 0)) * 100)}%
                    </p>
                </div>
            </div>

            {/* Charts */}
            {chartData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Budget Utilization by Type</h3>
                        <Pie data={chartData.typeData} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Budget Status Distribution</h3>
                        <Pie data={chartData.statusData} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Allocation vs Utilization</h3>
                        <Bar data={chartData.monthlyData} />
                    </div>
                </div>
            )}

            {/* Budgets List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilized
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
                            {budgets.map((budget) => (
                                <tr key={budget.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {budget.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {budget.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(budget.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(budget.utilized_amount)}
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className={`h-2.5 rounded-full ${
                                                    (budget.utilized_amount / budget.total_amount) > 0.9
                                                        ? 'bg-red-500'
                                                        : (budget.utilized_amount / budget.total_amount) > 0.7
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                }`}
                                                style={{
                                                    width: `${Math.min(
                                                        (budget.utilized_amount / budget.total_amount) * 100,
                                                        100
                                                    )}%`
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full
                                            ${budget.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                              budget.status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                                              budget.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                              'bg-red-100 text-red-800'}`}>
                                            {budget.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedBudget(budget);
                                                setBudgetData(budget);
                                                setShowBudgetModal(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 mr-2"
                                        >
                                            Edit
                                        </button>
                                        {budget.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleApprove(budget.id)}
                                                className="text-green-500 hover:text-green-700 mr-2"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {budget.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleClose(budget.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Close
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Budget Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedBudget ? 'Edit Budget' : 'New Budget'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={budgetData.title}
                                    onChange={(e) => setBudgetData({
                                        ...budgetData,
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
                                    value={budgetData.description}
                                    onChange={(e) => setBudgetData({
                                        ...budgetData,
                                        description: e.target.value
                                    })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Academic Year
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="YYYY-YYYY"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.academic_year}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            academic_year: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Type
                                    </label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.type}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            type: e.target.value
                                        })}
                                    >
                                        <option value="ANNUAL">Annual</option>
                                        <option value="TERM">Term</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="PROJECT">Project</option>
                                        <option value="SPECIAL">Special</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.start_date}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            start_date: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.end_date}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            end_date: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Total Amount
                                </label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={budgetData.total_amount}
                                    onChange={(e) => setBudgetData({
                                        ...budgetData,
                                        total_amount: e.target.value
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Allocations
                                </label>
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <span className="w-1/3">{category.name}</span>
                                            <input
                                                type="number"
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                value={budgetData.category_allocations[category.id] || ''}
                                                onChange={(e) => handleCategoryAllocationChange(
                                                    category.id,
                                                    e.target.value
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Warning Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.warning_threshold}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            warning_threshold: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Freeze Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={budgetData.freeze_threshold}
                                        onChange={(e) => setBudgetData({
                                            ...budgetData,
                                            freeze_threshold: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                    checked={budgetData.approval_required}
                                    onChange={(e) => setBudgetData({
                                        ...budgetData,
                                        approval_required: e.target.checked
                                    })}
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Require approval for expenses
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setShowBudgetModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {loading ? 'Processing...' : selectedBudget ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetManager;
