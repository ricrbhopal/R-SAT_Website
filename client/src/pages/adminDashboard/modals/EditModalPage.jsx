import react from 'react';
import { AdminAPI } from '../../../config/api';

export default function EditModalPage({ studentId, onClose }) {
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
      } finally {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await AdminAPI.updateStudent(studentId, student);
      onClose?.(); // Close modal on success
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return null; // Don't render modal if no id provided

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
    >
      <div
        className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : student ? (
          <form onSubmit={handleSubmit}>
            <h2 id="edit-student-title" className="text-2xl font-bold mb-4">
              Edit Student Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
              <div>
                <label className="font-medium">Full Name:</label>
                <input
                  type="text"
                  value={student.fullName ?? ''}
                  onChange={(e) => setStudent({ ...student, fullName: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="font-medium">Phone Number:</label>
                <input
                  type="text"
                  value={student.phoneNo ?? ''}
                  onChange={(e) => setStudent({ ...student, phoneNo: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="font-medium">Email:</label>
                <input
                  type="email"
                  value={student.mail_ID ?? ''}
                  onChange={(e) => setStudent({ ...student, mail_ID: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="font-medium">College:</label>
                <input
                  type="text"
                  value={student.college ?? ''}
                  onChange={(e) => setStudent({ ...student, college: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="font-medium">Branch:</label>
                <input
                  type="text"
                  value={student.branch ?? ''}
                  onChange={(e) => setStudent({ ...student, branch: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="font-medium">Year:</label>
                <input
                  type="text"
                  value={student.year ?? ''}
                  onChange={(e) => setStudent({ ...student, year: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center text-gray-600">No student data available.</div>
        )}
      </div>
    </div>
  );
}
