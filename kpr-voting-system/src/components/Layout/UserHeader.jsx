import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserHeader.css';

const UserHeader = () => {
  const { user, logout } = useAuth();

  if (!user || user.isAdmin) return null;

  return (
    <div className="user-header">
      <div className="user-info">
        <span className="welcome-text">Welcome,</span>
        <span className="user-name">{user.name}</span>
      </div>
      <button onClick={logout} className="user-logout-btn">
        Logout
      </button>
    </div>
  );
};

export default UserHeader;
