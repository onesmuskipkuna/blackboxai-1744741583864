import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import feeStructureService from '../services/feeStructureService';
import { formatAmount } from '../utils/academicUtils';

const FeeStructureComparison = () => {
    const [loading, setLoading] = useState(false);
    const [feeStructures, setFeeStructures] = useState([]);
    const [selectedStructures, setSelectedStructures] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [filters, setFilters] = useState({
        academic_year: '',
        term: ''
    });

    useEffect(() => {
        fetchFeeStructures();
    }, [filters]);

    const fetchFeeStructures = async () => {
        try {
            setLoading(true);
            const response = await feeStructureService.listFeeStructures(filters);
            setFeeStructures(response.data);
        } catch (error) {
            toast.error('Failed to fetch fee structures');
        } finally {
            setLoading(false);
        }
    };

    const handleStructureSelect = (structureId) => {
        setSelectedStructures(prev => {
            if (prev.includes(structureId)) {
                return prev.filter(id => id !== structureId);
            }
            if (prev.length < 3) {
                return [...prev, structureId];
            }
            toast.warning('You can compare up to 3 fee structures at a time');
            return prev;
        });
    };

    const compareStructures = async () => {
        if (selectedStructures.length < 2) {
            toast.warning('Please select at least 2 fee structures to compare');
            return;
        }

        try {
            setLoading(true);
            const response = await feeStructureService.compareStructures(selectedStructures);
            setComparisonData(response.data);
        } catch (error) {
            toast.error('Failed to compare fee structures');
        } finally {
            setLoading(false);
        }
    };

    const calculateDifference = (amount1, amount2) => {
        const diff = amount2 - amount1;
        const percentage = ((diff / amount1) * 100).toFixed(1);
        return {
            amount: diff,
            percentage: percentage
        };
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                    alt="Fee Comparison Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Fee Structure Comparison</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Academic Year
                        </label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="YYYY-YYYY"
                            value={filters.academic_year}
                            onChange={(e) => setFilters({...filters, academic_year: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Term
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.term}
                            onChange={(e) => setFilters({...filters, term: e.target.value})}
                        >
                            <option value="">All Terms</option>
                            <option value="TERM_1">Term 1</option>
                            <option value="TERM_2">Term 2</option>
                            <option value="TERM_3">Term 3</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Fee Structures Selection */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold mb-4">Select Fee Structures to Compare</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feeStructures.map(structure => (
                        <div 
                            key={structure.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors
                                ${selectedStructures.includes(structure.id) 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'}`}
                            onClick={() => handleStructureSelect(structure.id)}
                        >
                            <h4 className="font-semibold">{structure.class.toUpperCase()}</h4>
                            <p className="text-sm text-gray-600">{structure.academic_year}</p>
                            <p className="text-sm text-gray-600">{structure.term.replace('_', ' ')}</p>
                            <p className="mt-2 font-semibold">{formatAmount(structure.total_amount)}</p>
                        </div>
                    ))}
                </div>
                <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    onClick={compareStructures}
                    disabled={selectedStructures.length < 2 || loading}
                >
                    Compare Selected
                </button>
            </div>

            {/* Comparison Results */}
            {comparisonData && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Comparison Results</h3>
                    
                    {/* Summary */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-2">Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {comparisonData.structures.map(structure => (
                                <div key={structure.id} className="p-4 bg-gray-50 rounded">
                                    <h5 className="font-semibold">{structure.class.toUpperCase()}</h5>
                                    <p className="text-sm text-gray-600">{structure.academic_year}</p>
                                    <p className="text-lg font-bold mt-2">
                                        {formatAmount(structure.total_amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Comparison */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fee Item
                                    </th>
                                    {comparisonData.structures.map(structure => (
                                        <th key={structure.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {structure.class.toUpperCase()}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Difference
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {comparisonData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.name}
                                        </td>
                                        {item.amounts.map((amount, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap">
                                                {formatAmount(amount)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.amounts.length > 1 && (
                                                <div>
                                                    <span className={
                                                        calculateDifference(item.amounts[0], item.amounts[1]).amount > 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }>
                                                        {formatAmount(calculateDifference(item.amounts[0], item.amounts[1]).amount)}
                                                        {' '}
                                                        ({calculateDifference(item.amounts[0], item.amounts[1]).percentage}%)
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                                        Total
                                    </td>
                                    {comparisonData.structures.map(structure => (
                                        <td key={structure.id} className="px-6 py-4 whitespace-nowrap font-bold">
                                            {formatAmount(structure.total_amount)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                                        {comparisonData.structures.length > 1 && (
                                            <span className={
                                                calculateDifference(
                                                    comparisonData.structures[0].total_amount,
                                                    comparisonData.structures[1].total_amount
                                                ).amount > 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }>
                                                {formatAmount(calculateDifference(
                                                    comparisonData.structures[0].total_amount,
                                                    comparisonData.structures[1].total_amount
                                                ).amount)}
                                                {' '}
                                                ({calculateDifference(
                                                    comparisonData.structures[0].total_amount,
                                                    comparisonData.structures[1].total_amount
                                                ).percentage}%)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeStructureComparison;
