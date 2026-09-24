import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const dashboardPathByRole = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Student Management System
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to={dashboardPathByRole[user.role]}>Dashboard</Link>
            <Link to="/profile">My Profile</Link>
            <span className="navbar-user">
              {user.name} <span className="badge">{user.role}</span>
            </span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
