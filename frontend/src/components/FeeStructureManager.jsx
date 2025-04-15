import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatAmount } from '../utils/academicUtils';

const FeeStructureManager = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [formData, setFormData] = useState({
        class: '',
        academic_year: '',
        term: '',
        items: []
    });
    const [isEditing, setIsEditing] = useState(false);

    // Fee categories for grouping items
    const feeCategories = [
        'Tuition',
        'Transport',
        'Library',
        'Laboratory',
        'Sports',
        'Examination',
        'Other'
    ];

    useEffect(() => {
        fetchFeeStructures();
    }, []);

    const fetchFeeStructures = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/fee-structures');
            setFeeStructures(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch fee structures');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    item_name: '',
                    description: '',
                    amount: 0,
                    category: 'Tuition',
                    is_mandatory: true,
                    is_recurring: true,
                    payment_frequency: 'TERM'
                }
            ]
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditing && selectedStructure) {
                await axios.put(`/api/fee-structures/${selectedStructure.id}`, formData);
                toast.success('Fee structure updated successfully');
            } else {
                await axios.post('/api/fee-structures', formData);
                toast.success('Fee structure created successfully');
            }
            fetchFeeStructures();
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save fee structure');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            class: '',
            academic_year: '',
            term: '',
            items: []
        });
        setSelectedStructure(null);
        setIsEditing(false);
    };

    const handleEdit = (structure) => {
        setSelectedStructure(structure);
        setFormData({
            class: structure.class,
            academic_year: structure.academic_year,
            term: structure.term,
            items: structure.items
        });
        setIsEditing(true);
    };

    const handleCopy = async (structure) => {
        try {
            setLoading(true);
            const response = await axios.post(`/api/fee-structures/${structure.id}/copy`, {
                academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                term: structure.term
            });
            toast.success('Fee structure copied successfully');
            fetchFeeStructures();
        } catch (error) {
            toast.error('Failed to copy fee structure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg"
                    alt="Fee Structure Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Fee Structure Management</h2>
            </div>

            {/* Fee Structure Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.class}
                                onChange={(e) => setFormData({...formData, class: e.target.value})}
                                required
                            >
                                <option value="">Select Class</option>
                                {['pg', 'pp1', 'pp2', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6',
                                  'grade7', 'grade8', 'grade9', 'grade10'].map(cls => (
                                    <option key={cls} value={cls}>{cls.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="YYYY-YYYY"
                                value={formData.academic_year}
                                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Term</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.term}
                                onChange={(e) => setFormData({...formData, term: e.target.value})}
                                required
                            >
                                <option value="">Select Term</option>
                                <option value="TERM_1">Term 1</option>
                                <option value="TERM_2">Term 2</option>
                                <option value="TERM_3">Term 3</option>
                            </select>
                        </div>
                    </div>

                    {/* Fee Items */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Fee Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Add Item
                            </button>
                        </div>

                        {formData.items.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Item Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={item.item_name}
                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={item.category}
                                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                            required
                                        >
                                            {feeCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                checked={item.is_mandatory}
                                                onChange={(e) => handleItemChange(index, 'is_mandatory', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">Mandatory</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                checked={item.is_recurring}
                                                onChange={(e) => handleItemChange(index, 'is_recurring', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-600">Recurring</span>
                                        </label>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')} Fee Structure
                        </button>
                    </div>
                </form>
            </div>

            {/* Fee Structures List */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Fee Structures</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Class
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Academic Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Term
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {feeStructures.map((structure) => (
                                <tr key={structure.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {structure.class.toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {structure.academic_year}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {structure.term.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(structure.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleEdit(structure)}
                                            className="text-blue-500 hover:text-blue-700 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleCopy(structure)}
                                            className="text-green-500 hover:text-green-700"
                                        >
                                            Copy
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeeStructureManager;
