import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminDashboard = () => {
  const { logout } = useAuth();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
      
      <div className="admin-grid">
        <Link to="/admin/roles" className="admin-card">
          <div className="admin-card-icon">👥</div>
          <h2>Manage Roles</h2>
          <p>Add, edit, or delete voting roles</p>
        </Link>
        
        <Link to="/admin/candidates" className="admin-card">
          <div className="admin-card-icon">🎯</div>
          <h2>Manage Candidates</h2>
          <p>Add, edit, or delete candidates</p>
        </Link>
        
        <Link to="/admin/results" className="admin-card">
          <div className="admin-card-icon">📊</div>
          <h2>View Results</h2>
          <p>See real-time voting results</p>
        </Link>
        
        <div className="admin-card reset-card" onClick={() => {
          if (window.confirm('Are you sure you want to reset all votes?')) {
            // Reset logic will be implemented in VoteResults component
            alert('Please use the reset button in View Results page');
          }
        }}>
          <div className="admin-card-icon">🔄</div>
          <h2>Reset Votes</h2>
          <p>Clear all voting data</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
