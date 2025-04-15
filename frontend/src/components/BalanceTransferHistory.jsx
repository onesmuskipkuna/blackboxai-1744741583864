import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const BalanceTransferHistory = ({ studentId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTransfer, setExpandedTransfer] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchBalanceHistory();
        }
    }, [studentId]);

    const fetchBalanceHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/students/${studentId}/balance-transfers`);
            setHistory(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch balance transfer history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">No balance transfer history found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Balance Transfer History</h3>
            
            {history.map((transfer) => (
                <div 
                    key={transfer.id} 
                    className="bg-white rounded-lg shadow-sm border p-4"
                >
                    {/* Transfer Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="font-semibold">
                                Transfer #{transfer.id}
                            </h4>
                            <p className="text-sm text-gray-600">
                                {formatDate(transfer.transfer_date)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">
                                {formatAmount(transfer.total_balance_transferred)}
                            </p>
                            <span className={`
                                px-2 py-1 text-xs rounded-full
                                ${transfer.status === 'TRANSFERRED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'}
                            `}>
                                {transfer.status}
                            </span>
                        </div>
                    </div>

                    {/* Class Information */}
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <div>
                            <p>From: {transfer.from_class}</p>
                            <p className="text-xs">({transfer.from_term})</p>
                        </div>
                        <div className="text-center">
                            <i className="fas fa-arrow-right"></i>
                        </div>
                        <div className="text-right">
                            <p>To: {transfer.to_class}</p>
                            <p className="text-xs">({transfer.to_term})</p>
                        </div>
                    </div>

                    {/* Toggle Details Button */}
                    <button
                        onClick={() => setExpandedTransfer(
                            expandedTransfer === transfer.id ? null : transfer.id
                        )}
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                    >
                        {expandedTransfer === transfer.id ? (
                            <>
                                <i className="fas fa-chevron-up mr-1"></i>
                                Hide Details
                            </>
                        ) : (
                            <>
                                <i className="fas fa-chevron-down mr-1"></i>
                                Show Details
                            </>
                        )}
                    </button>

                    {/* Detailed Balance Items */}
                    {expandedTransfer === transfer.id && (
                        <div className="mt-4">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">Fee Item</th>
                                        <th className="px-4 py-2 text-right">Original</th>
                                        <th className="px-4 py-2 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transfer.balanceDetails.map((detail) => (
                                        <tr key={detail.id} className="border-b">
                                            <td className="px-4 py-2">
                                                {detail.fee_item_name}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {formatAmount(detail.original_amount)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {formatAmount(detail.balance_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-semibold">
                                        <td className="px-4 py-2">Total</td>
                                        <td className="px-4 py-2 text-right">
                                            {formatAmount(transfer.balanceDetails.reduce(
                                                (sum, detail) => sum + parseFloat(detail.original_amount),
                                                0
                                            ))}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {formatAmount(transfer.total_balance_transferred)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Additional Information */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-semibold mb-2">Transfer Information</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Academic Year</p>
                                        <p>{transfer.from_term} → {transfer.to_term}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Transfer Date</p>
                                        <p>{formatDate(transfer.transfer_date)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default BalanceTransferHistory;
