import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await db.getElections();
      
      if (fetchError) {
        throw fetchError;
      }

      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const getElectionStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return { status: 'upcoming', color: '#3b82f6' };
    if (now > end) return { status: 'ended', color: '#6b7280' };
    return { status: 'active', color: '#10b981' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name || user?.email}!</h1>
        <p>Here's what's happening in the KPR Voting System</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Elections</h3>
          <div className="stat-number">{elections.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Elections</h3>
          <div className="stat-number">
            {elections.filter(election => {
              const { status } = getElectionStatus(election.start_date, election.end_date);
              return status === 'active';
            }).length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Upcoming Elections</h3>
          <div className="stat-number">
            {elections.filter(election => {
              const { status } = getElectionStatus(election.start_date, election.end_date);
              return status === 'upcoming';
            }).length}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section">
          <div className="section-header">
            <h2>Elections</h2>
            <Link to="/elections" className="view-all-link">
              View All Elections →
            </Link>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {elections.length === 0 ? (
            <div className="empty-state">
              <h3>No elections available</h3>
              <p>There are currently no elections in the system.</p>
            </div>
          ) : (
            <div className="elections-grid">
              {elections.slice(0, 6).map(election => {
                const { status, color } = getElectionStatus(election.start_date, election.end_date);
                
                return (
                  <div key={election.id} className="election-card">
                    <div className="election-status" style={{ backgroundColor: color }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    
                    <h3>{election.title}</h3>
                    <p className="election-description">{election.description}</p>
                    
                    <div className="election-dates">
                      <div className="date-item">
                        <span className="date-label">Starts:</span>
                        <span>{formatDate(election.start_date)}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Ends:</span>
                        <span>{formatDate(election.end_date)}</span>
                      </div>
                    </div>

                    <div className="election-actions">
                      <Link 
                        to={`/elections/${election.id}`}
                        className="election-link"
                      >
                        View Election
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {user?.role === 'admin' && (
          <div className="admin-section">
            <h2>Admin Actions</h2>
            <div className="admin-actions">
              <Link to="/admin/elections/new" className="admin-button">
                Create New Election
              </Link>
              <Link to="/admin" className="admin-button secondary">
                Admin Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
