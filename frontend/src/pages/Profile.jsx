import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        password: '',
        className: data.class_name || '',
        dateOfBirth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
        guardianName: data.guardian_name || '',
        subjectSpecialization: data.subject_specialization || '',
        department: data.department || '',
        rollNumber: data.roll_number || '',
        employeeId: data.employee_id || '',
        email: data.email,
      });
    });
  }, []);

  if (!form) return <p className="page-loading">Loading profile...</p>;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await api.put('/users/me', payload);
      setUser({ ...user, name: data.name });
      setMessage('Profile updated successfully');
      setForm({ ...form, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2>My Profile</h2>
        <p className="muted">Role: {user.role} &middot; Email: {form.email} (not editable)</p>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <div className="form-row">
            <label>
              Phone
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
            </label>
            <label>
              Address
              <input type="text" name="address" value={form.address} onChange={handleChange} />
            </label>
          </div>

          {user.role === 'student' && (
            <div className="form-row">
              <label>
                Class
                <input type="text" name="className" value={form.className} onChange={handleChange} />
              </label>
              <label>
                Date of birth
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
              </label>
              <label>
                Guardian name
                <input type="text" name="guardianName" value={form.guardianName} onChange={handleChange} />
              </label>
            </div>
          )}

          {user.role === 'teacher' && (
            <div className="form-row">
              <label>
                Subject specialization
                <input
                  type="text"
                  name="subjectSpecialization"
                  value={form.subjectSpecialization}
                  onChange={handleChange}
                />
              </label>
              <label>
                Department
                <input type="text" name="department" value={form.department} onChange={handleChange} />
              </label>
            </div>
          )}

          <label>
            New password (leave blank to keep current)
            <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} />
          </label>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
