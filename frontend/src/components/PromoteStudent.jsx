import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PromoteStudent = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [balanceDetails, setBalanceDetails] = useState(null);
    const [formData, setFormData] = useState({
        toClass: '',
        toAcademicYear: '',
        remarks: ''
    });

    // Get available classes based on current class
    const getNextClasses = (currentClass) => {
        const primaryClasses = ['pg', 'pp1', 'pp2', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6'];
        const juniorClasses = ['grade7', 'grade8', 'grade9', 'grade10'];
        
        const currentIndex = primaryClasses.indexOf(currentClass?.toLowerCase());
        if (currentIndex !== -1) {
            if (currentIndex === primaryClasses.length - 1) {
                // If current class is grade6, next class is grade7
                return [juniorClasses[0]];
            }
            return [primaryClasses[currentIndex + 1]];
        }
        
        const juniorIndex = juniorClasses.indexOf(currentClass?.toLowerCase());
        if (juniorIndex !== -1 && juniorIndex < juniorClasses.length - 1) {
            return [juniorClasses[juniorIndex + 1]];
        }
        
        return [];
    };

    // Fetch students on component mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('/api/students');
                setStudents(response.data);
            } catch (error) {
                toast.error('Failed to fetch students');
            }
        };
        fetchStudents();
    }, []);

    // Fetch student details and outstanding balances when a student is selected
    const handleStudentSelect = async (studentId) => {
        try {
            setLoading(true);
            const [studentResponse, balanceResponse] = await Promise.all([
                axios.get(`/api/students/${studentId}`),
                axios.get(`/api/students/${studentId}/outstanding-balance`)
            ]);

            setSelectedStudent(studentResponse.data);
            setBalanceDetails(balanceResponse.data);

            // Set default academic year (current year - next year)
            const currentYear = new Date().getFullYear();
            setFormData(prev => ({
                ...prev,
                toAcademicYear: `${currentYear}-${currentYear + 1}`
            }));
        } catch (error) {
            toast.error('Failed to fetch student details');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (e) => {
        e.preventDefault();
        
        if (!selectedStudent) {
            toast.error('Please select a student');
            return;
        }

        if (!formData.toClass) {
            toast.error('Please select the class to promote to');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/promotions/students/${selectedStudent.id}/promote`, formData);

            toast.success('Student promoted successfully');

            // Show balance transfer details if any
            if (response.data.balanceTransfer) {
                setBalanceDetails(response.data.balanceTransfer);
            }

            // Reset form
            setFormData({
                toClass: '',
                toAcademicYear: '',
                remarks: ''
            });
            setSelectedStudent(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to promote student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg"
                    alt="Education Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold mb-4">Student Promotion</h2>
            </div>

            {/* Student Selection */}
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Select Student
                </label>
                <select 
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    value={selectedStudent?.id || ''}
                >
                    <option value="">Select a student...</option>
                    {students.map(student => (
                        <option key={student.id} value={student.id}>
                            {student.admission_number} - {student.first_name} {student.last_name}
                            ({student.current_class})
                        </option>
                    ))}
                </select>
            </div>

            {/* Current Fee Balances */}
            {selectedStudent && balanceDetails && (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                    <h3 className="text-lg font-semibold mb-3">
                        Current Outstanding Balances
                    </h3>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Fee Item</th>
                                <th className="p-2 text-right">Original Amount</th>
                                <th className="p-2 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balanceDetails.items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{item.fee_item_name}</td>
                                    <td className="p-2 text-right">
                                        {item.original_amount.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right">
                                        {item.balance_amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td className="p-2">Total Balance:</td>
                                <td></td>
                                <td className="p-2 text-right">
                                    {balanceDetails.total.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Promotion Form */}
            {selectedStudent && (
                <form onSubmit={handlePromote} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Current Class
                            </label>
                            <input
                                type="text"
                                value={selectedStudent.current_class || ''}
                                disabled
                                className="w-full p-2 bg-gray-100 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Promote To
                            </label>
                            <select 
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.toClass}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    toClass: e.target.value
                                })}
                            >
                                <option value="">Select new class...</option>
                                {getNextClasses(selectedStudent.current_class).map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Academic Year
                        </label>
                        <input
                            type="text"
                            value={formData.toAcademicYear}
                            onChange={(e) => setFormData({
                                ...formData,
                                toAcademicYear: e.target.value
                            })}
                            placeholder="YYYY-YYYY"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Remarks
                        </label>
                        <textarea
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.remarks}
                            onChange={(e) => setFormData({
                                ...formData,
                                remarks: e.target.value
                            })}
                            rows="3"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`
                            w-full md:w-auto px-6 py-2 rounded
                            ${loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'}
                            text-white font-semibold
                            transition duration-300
                        `}
                    >
                        {loading ? 'Processing...' : 'Promote Student'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default PromoteStudent;
