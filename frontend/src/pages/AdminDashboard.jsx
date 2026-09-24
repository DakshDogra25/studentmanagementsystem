import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  phone: '',
  address: '',
  rollNumber: '',
  className: '',
  employeeId: '',
  subjectSpecialization: '',
  department: '',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState(emptyUserForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [marks, setMarks] = useState([]);
  const [editingMarkId, setEditingMarkId] = useState(null);
  const [editMarkForm, setEditMarkForm] = useState({});

  async function loadUsers() {
    const { data } = await api.get('/admin/users', { params: roleFilter ? { role: roleFilter } : {} });
    setUsers(data);
  }

  async function loadMarks() {
    const { data } = await api.get('/marks');
    setMarks(data);
  }

  useEffect(() => {
    loadUsers().catch((err) => setError(err.response?.data?.message || 'Failed to load users'));
  }, [roleFilter]);

  useEffect(() => {
    if (tab === 'marks') {
      loadMarks().catch((err) => setError(err.response?.data?.message || 'Failed to load marks'));
    }
  }, [tab]);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.post('/admin/users', form);
      setForm(emptyUserForm);
      setMessage('User created successfully');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditUser(u) {
    setEditingUserId(u.id);
    setEditUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      password: '',
    });
  }

  function cancelEditUser() {
    setEditingUserId(null);
    setEditUserForm(emptyUserForm);
  }

  function handleEditUserChange(e) {
    setEditUserForm({ ...editUserForm, [e.target.name]: e.target.value });
  }

  async function saveEditUser(id) {
    setError('');
    try {
      const payload = { ...editUserForm };
      if (!payload.password) delete payload.password;
      await api.put(`/admin/users/${id}`, payload);
      cancelEditUser();
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  }

  function startEditMark(m) {
    setEditingMarkId(m.id);
    setEditMarkForm({
      subject: m.subject,
      examType: m.exam_type,
      marksObtained: m.marks_obtained,
      maxMarks: m.max_marks,
    });
  }

  function handleEditMarkChange(e) {
    setEditMarkForm({ ...editMarkForm, [e.target.name]: e.target.value });
  }

  async function saveEditMark(id) {
    setError('');
    try {
      await api.put(`/marks/${id}`, editMarkForm);
      setEditingMarkId(null);
      await loadMarks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update marks');
    }
  }

  async function handleDeleteMark(id) {
    if (!window.confirm('Delete this mark record?')) return;
    setError('');
    try {
      await api.delete(`/marks/${id}`);
      await loadMarks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete marks');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome, {user.name} (Admin)</h2>
        <Link className="btn btn-secondary" to="/profile">
          Edit Profile
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <div className="tabs">
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Manage Users
        </button>
        <button className={`tab ${tab === 'marks' ? 'active' : ''}`} onClick={() => setTab('marks')}>
          Manage Marks
        </button>
      </div>

      {tab === 'users' && (
        <>
          <div className="card">
            <h3>Create User</h3>
            <form onSubmit={handleCreateUser} className="form-row">
              <label>
                Name
                <input name="name" value={form.name} onChange={handleFormChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleFormChange} required />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  minLength={6}
                  required
                />
              </label>
              <label>
                Role
                <select name="role" value={form.role} onChange={handleFormChange}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleFormChange} />
              </label>

              {form.role === 'student' && (
                <>
                  <label>
                    Roll number
                    <input name="rollNumber" value={form.rollNumber} onChange={handleFormChange} />
                  </label>
                  <label>
                    Class
                    <input name="className" value={form.className} onChange={handleFormChange} />
                  </label>
                </>
              )}

              {form.role === 'teacher' && (
                <>
                  <label>
                    Employee ID
                    <input name="employeeId" value={form.employeeId} onChange={handleFormChange} />
                  </label>
                  <label>
                    Subject specialization
                    <input
                      name="subjectSpecialization"
                      value={form.subjectSpecialization}
                      onChange={handleFormChange}
                    />
                  </label>
                  <label>
                    Department
                    <input name="department" value={form.department} onChange={handleFormChange} />
                  </label>
                </>
              )}

              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="page-header">
              <h3>All Users</h3>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) =>
                  editingUserId === u.id ? (
                    <tr key={u.id}>
                      <td>
                        <input name="name" value={editUserForm.name} onChange={handleEditUserChange} />
                      </td>
                      <td>
                        <input name="email" value={editUserForm.email} onChange={handleEditUserChange} />
                      </td>
                      <td>
                        <select name="role" value={editUserForm.role} onChange={handleEditUserChange}>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <input name="phone" value={editUserForm.phone} onChange={handleEditUserChange} />
                      </td>
                      <td className="table-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => saveEditUser(u.id)}>
                          Save
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={cancelEditUser}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge">{u.role}</span>
                      </td>
                      <td>{u.phone || '—'}</td>
                      <td className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEditUser(u)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === user.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'marks' && (
        <div className="card">
          <h3>All Marks</h3>
          {marks.length === 0 && <p className="muted">No marks recorded yet.</p>}
          {marks.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Marks</th>
                  <th>Allotted by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) =>
                  editingMarkId === m.id ? (
                    <tr key={m.id}>
                      <td>{m.student_name}</td>
                      <td>
                        <input name="subject" value={editMarkForm.subject} onChange={handleEditMarkChange} />
                      </td>
                      <td>
                        <input name="examType" value={editMarkForm.examType} onChange={handleEditMarkChange} />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="marksObtained"
                          value={editMarkForm.marksObtained}
                          onChange={handleEditMarkChange}
                          style={{ width: 60 }}
                        />
                        {' / '}
                        <input
                          type="number"
                          name="maxMarks"
                          value={editMarkForm.maxMarks}
                          onChange={handleEditMarkChange}
                          style={{ width: 60 }}
                        />
                      </td>
                      <td>{m.teacher_name || '—'}</td>
                      <td className="table-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => saveEditMark(m.id)}>
                          Save
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingMarkId(null)}>
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
                      <td>{m.teacher_name || '—'}</td>
                      <td className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEditMark(m)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMark(m.id)}>
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
      )}
    </div>
  );
}
