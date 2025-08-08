import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import './Admin.css';

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    order_index: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('order_index');
    
    if (!error) {
      setRoles(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roleData = {
        name: formData.name,
        order_index: parseInt(formData.order_index)
      };

      if (editingId) {
        const { error } = await supabase
          .from('roles')
          .update(roleData)
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roles')
          .insert([roleData]);
          
        if (error) throw error;
      }

      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role');
    }
    
    setLoading(false);
  };

  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      order_index: role.order_index.toString()
    });
    setEditingId(role.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will also delete all candidates for this role.')) {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
        
      if (!error) {
        fetchRoles();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      order_index: ''
    });
    setEditingId(null);
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Roles</h2>
        <Link to="/admin" className="back-link">← Back to Dashboard</Link>
      </div>
      
      <form onSubmit={handleSubmit} className="role-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Role Name (e.g., President)"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          
          <input
            type="number"
            placeholder="Order"
            value={formData.order_index}
            onChange={(e) => setFormData({...formData, order_index: e.target.value})}
            required
            min="1"
          />
        </div>
        
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Role
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="roles-list">
        {roles.map(role => (
          <div key={role.id} className="role-item">
            <div className="role-info">
              <h3>{role.name}</h3>
              <p>Order: {role.order_index}</p>
            </div>
            <div className="role-actions">
              <button onClick={() => handleEdit(role)} className="edit-btn">
                Edit
              </button>
              <button onClick={() => handleDelete(role.id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageRoles;
