import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invoiceService from '../services/invoiceService';
import { formatAmount, formatDate } from '../utils/academicUtils';

const PaymentReceipt = ({ paymentId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(null);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        if (paymentId) {
            fetchPaymentDetails();
        }
    }, [paymentId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.getPayment(paymentId);
            setPayment(response.data);
        } catch (error) {
            toast.error('Failed to fetch payment details');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        setPrinting(true);
        window.print();
        setPrinting(false);
    };

    const handleDownload = async () => {
        try {
            const blob = await invoiceService.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${payment.receipt_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download receipt');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="text-center p-6">
                <p className="text-red-500">Payment not found</p>
            </div>
        );
    }

    return (
        <div className={`bg-white ${printing ? '' : 'p-6 rounded-lg shadow'}`}>
            {/* Receipt Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Payment Receipt</h2>
                <p className="text-gray-600">Receipt No: {payment.receipt_number}</p>
                <p className="text-gray-600">Date: {formatDate(payment.payment_date)}</p>
            </div>

            {/* School Details */}
            <div className="mb-8">
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">School Name</h3>
                    <p className="text-gray-600">School Address Line 1</p>
                    <p className="text-gray-600">School Address Line 2</p>
                    <p className="text-gray-600">Phone: (123) 456-7890</p>
                </div>
            </div>

            {/* Student Details */}
            <div className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium text-gray-700">Student Details</h4>
                        <p>Name: {payment.student.first_name} {payment.student.last_name}</p>
                        <p>Admission No: {payment.student.admission_number}</p>
                        <p>Class: {payment.invoice.class}</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-700">Payment Details</h4>
                        <p>Invoice No: {payment.invoice.invoice_number}</p>
                        <p>Payment Mode: {payment.payment_mode.replace('_', ' ')}</p>
                        <p>Status: {payment.status}</p>
                    </div>
                </div>
            </div>

            {/* Payment Items */}
            <div className="mb-8">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payment.items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4">
                                    {item.invoiceItem.item_name}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {formatAmount(item.amount)}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                            <td className="px-6 py-4">Total</td>
                            <td className="px-6 py-4 text-right">
                                {formatAmount(payment.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment Transaction Details */}
            {payment.payment_mode !== 'CASH' && (
                <div className="mb-8">
                    <h4 className="font-medium text-gray-700 mb-2">Transaction Details</h4>
                    <div className="bg-gray-50 p-4 rounded">
                        {payment.payment_mode === 'CHEQUE' && (
                            <>
                                <p>Cheque Number: {payment.payment_details.cheque_number}</p>
                                <p>Bank: {payment.payment_details.bank_name}</p>
                            </>
                        )}
                        {payment.payment_mode === 'BANK_TRANSFER' && (
                            <p>Transaction ID: {payment.payment_details.transaction_id}</p>
                        )}
                        {['CREDIT_CARD', 'DEBIT_CARD'].includes(payment.payment_mode) && (
                            <p>Card: XXXX-XXXX-XXXX-{payment.payment_details.card_last_digits}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-600">
                <p>This is a computer-generated receipt and does not require a signature.</p>
                <p>Thank you for your payment!</p>
            </div>

            {/* Action Buttons - Hide when printing */}
            {!printing && (
                <div className="mt-8 flex justify-end space-x-4 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Print Receipt
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default PaymentReceipt;
