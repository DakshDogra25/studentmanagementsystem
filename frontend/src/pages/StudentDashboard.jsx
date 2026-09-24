import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/students/me/marks')
      .then(({ data }) => setMarks(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load marks'))
      .finally(() => setLoading(false));
  }, []);

  const totalObtained = marks.reduce((sum, m) => sum + Number(m.marks_obtained), 0);
  const totalMax = marks.reduce((sum, m) => sum + Number(m.max_marks), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome, {user.name}</h2>
        <Link className="btn btn-secondary" to="/profile">
          Edit Profile
        </Link>
      </div>

      {percentage !== null && (
        <div className="card summary-card">
          <div>
            <span className="summary-label">Total</span>
            <span className="summary-value">
              {totalObtained} / {totalMax}
            </span>
          </div>
          <div>
            <span className="summary-label">Percentage</span>
            <span className="summary-value">{percentage}%</span>
          </div>
        </div>
      )}

      <div className="card">
        <h3>My Marks</h3>
        {loading && <p>Loading...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && marks.length === 0 && <p className="muted">No marks have been allotted yet.</p>}
        {marks.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Allotted by</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id}>
                  <td>{m.subject}</td>
                  <td>{m.exam_type}</td>
                  <td>
                    {m.marks_obtained} / {m.max_marks}
                  </td>
                  <td>{m.teacher_name || '—'}</td>
                  <td>{new Date(m.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
