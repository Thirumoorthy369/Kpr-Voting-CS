import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import './Admin.css';

const VotingStatus = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [candidates, setCandidates] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'voted', 'not-voted'

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to fetch all records with pagination
  const fetchAllRecords = async (tableName, selectQuery = '*') => {
    let allRecords = [];
    let page = 0;
    const pageSize = 1000; // Adjust as needed, 1000 is a common default

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data);
        page++;
      } else {
        break; // No more data
      }
    }
    return allRecords;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all necessary data in parallel using the helper function
      const [
        usersData,
        rolesData,
        candidatesData,
        userVotesData
      ] = await Promise.all([
        fetchAllRecords('users', '*'),
        fetchAllRecords('roles', 'id, name'),
        fetchAllRecords('candidates', 'id, name'),
        fetchAllRecords('user_votes', 'user_id, role_id, candidate_id')
      ]);

      // Process roles and candidates into maps for easy lookup
      const rolesMap = rolesData.reduce((acc, role) => {
        acc[role.id] = role.name;
        return acc;
      }, {});
      setRoles(rolesMap);

      const candidatesMap = candidatesData.reduce((acc, candidate) => {
        acc[candidate.id] = candidate.name;
        return acc;
      }, {});
      setCandidates(candidatesMap);

      // Process user votes into a map
      const userVotesMap = userVotesData.reduce((acc, vote) => {
        if (!acc[vote.user_id]) {
          acc[vote.user_id] = [];
        }
        acc[vote.user_id].push({ 
          role_id: vote.role_id, 
          candidate_id: vote.candidate_id 
        });
        return acc;
      }, {});
      setUserVotes(userVotesMap);
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching voting status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetVotes = async (userId) => {
    if (window.confirm(`Are you sure you want to reset all votes for user ${userId}? This action cannot be undone.`)) {
      try {
        // Delete records from all relevant tables
        const { error: userVotesError } = await supabase.from('user_votes').delete().eq('user_id', userId);
        if (userVotesError) throw userVotesError;

        const { error: votesError } = await supabase.from('votes').delete().eq('user_id', userId);
        if (votesError) throw votesError;

        // Update the user's status
        const { error: userError } = await supabase.from('users').update({ has_voted: false }).eq('id', userId);
        if (userError) throw userError;

        alert(`Votes for user ${userId} have been successfully reset.`);

        // Refresh data to reflect changes
        fetchData();

      } catch (error) {
        console.error('Error resetting votes:', error);
        alert('An error occurred while resetting the votes. Please check the console for details.');
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const email = user.email || '';
      const userId = user.id || '';
      const matchesSearch = email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            userId.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedFilter === 'voted') {
        return matchesSearch && user.has_voted;
      } else if (selectedFilter === 'not-voted') {
        return matchesSearch && !user.has_voted;
      }
      return matchesSearch;
    });
  }, [users, searchTerm, selectedFilter]);

  return (
    <div className="voting-status-container">
      <div className="voting-status-header">
        <h1>Voting Status</h1>
        <div className="voting-status-controls">
          <input
            type="text"
            placeholder="Search by Email or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="voted">Voted</option>
            <option value="not-voted">Not Voted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="voting-status-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className={`voting-status-card ${user.has_voted ? 'voted' : 'not-voted'}`}>
              <div className="voter-info">
                <h3>{user.email}</h3>
                <p className="user-id">ID: {user.id}</p>
                <span className={`status-badge ${user.has_voted ? 'voted' : 'not-voted'}`}>
                  {user.has_voted ? 'Voted' : 'Not Voted'}
                </span>
              </div>
              {(userVotes[user.id]?.length > 0) && (
                <div className="votes-info">
                  <h4>Votes Cast:</h4>
                  <ul>
                    {userVotes[user.id].map(vote => (
                      <li key={vote.role_id}>
                        <strong>{roles[vote.role_id] || 'Unknown Role'}:</strong>
                        <span> {candidates[vote.candidate_id] || 'Unknown Candidate'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="card-actions">
                <button 
                  className="reset-button"
                  onClick={() => handleResetVotes(user.id)}
                >
                  Reset Votes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VotingStatus;
