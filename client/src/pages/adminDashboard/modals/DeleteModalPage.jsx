import react from 'react';

import { AdminAPI } from '../../../config/api';  

export default function DeleteModalPage({ studentId, onClose }) {
  const [student, setStudent] = react.useState(null);
  const [loading, setLoading] = react.useState(true);
  const [error, setError] = react.useState('');
    // Fetch student data when studentId changes
    react.useEffect(() => {
        let mounted = true;
        const fetchStudent = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await AdminAPI.getStudentById(studentId);
                if (!mounted) return;
                setStudent(response.data ?? null);
            } catch (err) {
                console.error('Error fetching student:', err);
                if (!mounted) return;
                setError('Failed to fetch student details. Please try again later.');
            }
            finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        if (studentId) {
            fetchStudent();
        } else {
            setStudent(null);
            setLoading(false);
            setError('');
        }
        return () => {
            mounted = false;
        };
    }, [studentId]);
    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await AdminAPI.deleteStudent(studentId);
            onClose?.(); // Close modal on success
        } catch (err) {
            console.error('Error deleting student:', err);
            setError('Failed to delete student. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    if (!studentId) return null; // Don't render modal if no id provided
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Student</h2>
                {loading ? (
                    <p className="text-gray-600">Processing...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : (
                    <>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">
                                {student?.fullName || 'this student'}
                            </span>
                            ? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-200 text-red-600 font-semibold  hover:text-white rounded-md hover:bg-red-400 cursor-pointer transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}