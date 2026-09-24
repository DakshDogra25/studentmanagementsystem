import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  email: '',
  password: '',
  rollNumber: '',
  className: '',
  dateOfBirth: '',
  guardianName: '',
  phone: '',
  address: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>
        {error && <p className="error-text">{error}</p>}

        <label>
          Full name
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Roll number
            <input type="text" name="rollNumber" value={form.rollNumber} onChange={handleChange} />
          </label>
          <label>
            Class
            <input type="text" name="className" value={form.className} onChange={handleChange} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Date of birth
            <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
          </label>
          <label>
            Guardian name
            <input type="text" name="guardianName" value={form.guardianName} onChange={handleChange} />
          </label>
        </div>

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

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
