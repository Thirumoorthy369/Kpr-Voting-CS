import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Voting.css';

const RoleSelection = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('order_index');
      
      if (!error) {
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
    setLoading(false);
  };

  const handleRoleSelect = (roleId) => {
    navigate(`/voting/role/${roleId}`);
  };

  if (loading) return <div className="loading">Loading roles...</div>;

  return (
    <div className="role-selection-container">
      <div className="voting-header">
        <h1>Select a Position to Vote</h1>
        <p>Choose the position you want to cast your vote for</p>
      </div>
      
      <div className="roles-grid">
        {roles.map((role, index) => (
          <div 
            key={role.id} 
            className="role-card"
            onClick={() => handleRoleSelect(role.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="role-icon">
              {index === 0 ? '👑' : index === 1 ? '🏆' : index === 2 ? '📝' : '💰'}
            </div>
            <h2>{role.name}</h2>
            <p>Click to view candidates</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelection;
