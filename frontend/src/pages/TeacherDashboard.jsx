import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyForm = { studentId: '', subject: '', examType: 'General', marksObtained: '', maxMarks: 100 };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [studentsRes, marksRes] = await Promise.all([api.get('/students'), api.get('/marks')]);
    setStudents(studentsRes.data);
    setMarks(marksRes.data);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.response?.data?.message || 'Failed to load data'));
  }, []);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAllot(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.post('/marks', form);
      setForm(emptyForm);
      setMessage('Marks allotted successfully');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allot marks');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(mark) {
    setEditingId(mark.id);
    setEditForm({
      studentId: mark.student_id,
      subject: mark.subject,
      examType: mark.exam_type,
      marksObtained: mark.marks_obtained,
      maxMarks: mark.max_marks,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function saveEdit(id) {
    setError('');
    try {
      await api.put(`/marks/${id}`, {
        subject: editForm.subject,
        examType: editForm.examType,
        marksObtained: editForm.marksObtained,
        maxMarks: editForm.maxMarks,
      });
      cancelEdit();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update marks');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this mark record?')) return;
    setError('');
    try {
      await api.delete(`/marks/${id}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete marks');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome, {user.name}</h2>
        <Link className="btn btn-secondary" to="/profile">
          Edit Profile
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <div className="card">
        <h3>Allot Marks</h3>
        <form onSubmit={handleAllot} className="form-row">
          <label>
            Student
            <select name="studentId" value={form.studentId} onChange={handleFormChange} required>
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.roll_number ? `(${s.roll_number})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <input type="text" name="subject" value={form.subject} onChange={handleFormChange} required />
          </label>
          <label>
            Exam type
            <input type="text" name="examType" value={form.examType} onChange={handleFormChange} />
          </label>
          <label>
            Marks obtained
            <input
              type="number"
              name="marksObtained"
              value={form.marksObtained}
              onChange={handleFormChange}
              min={0}
              required
            />
          </label>
          <label>
            Max marks
            <input type="number" name="maxMarks" value={form.maxMarks} onChange={handleFormChange} min={1} required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Allot Marks'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>All Students' Marks</h3>
        {marks.length === 0 && <p className="muted">No marks recorded yet.</p>}
        {marks.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) =>
                editingId === m.id ? (
                  <tr key={m.id}>
                    <td>{m.student_name}</td>
                    <td>
                      <input name="subject" value={editForm.subject} onChange={handleEditChange} />
                    </td>
                    <td>
                      <input name="examType" value={editForm.examType} onChange={handleEditChange} />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="marksObtained"
                        value={editForm.marksObtained}
                        onChange={handleEditChange}
                        style={{ width: 60 }}
                      />
                      {' / '}
                      <input
                        type="number"
                        name="maxMarks"
                        value={editForm.maxMarks}
                        onChange={handleEditChange}
                        style={{ width: 60 }}
                      />
                    </td>
                    <td className="table-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td>{m.student_name}</td>
                    <td>{m.subject}</td>
                    <td>{m.exam_type}</td>
                    <td>
                      {m.marks_obtained} / {m.max_marks}
                    </td>
                    <td className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Students</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll no.</th>
              <th>Class</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.roll_number || '—'}</td>
                <td>{s.class_name || '—'}</td>
                <td>{s.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
