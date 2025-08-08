import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import RolePieChart from './RolePieChart';
import './Admin.css';

const VoteResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchResults();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('vote-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'votes' 
      }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchResults = async () => {
    try {
      // Fetch all roles with candidates
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*, candidates(*)')
        .order('order_index');

      // Fetch total votes
      const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      setTotalVotes(count || 0);

      // Organize results by role and calculate percentages
      const formattedResults = rolesData?.map(role => {
        // Calculate total votes for this role
        const roleTotalVotes = role.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
        
        // Sort candidates by votes and calculate percentages
        const candidatesWithPercentage = role.candidates
          .sort((a, b) => (b.votes || 0) - (a.votes || 0))
          .map(candidate => ({
            ...candidate,
            percentage: roleTotalVotes > 0 ? ((candidate.votes || 0) / roleTotalVotes * 100).toFixed(1) : 0
          }));

        return {
          role: role.name,
          roleId: role.id,
          candidates: candidatesWithPercentage
        };
      }) || [];

      setResults(formattedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
    setLoading(false);
  };

  const handleResetVotes = async () => {
    if (!window.confirm('Are you sure you want to reset all votes? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      // Reset all candidate vote counts
      await supabase
        .from('candidates')
        .update({ votes: 0 })
        .gte('votes', 0);

      // Delete all vote records
      await supabase
        .from('votes')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      // Delete all user votes
      await supabase
        .from('user_votes')
        .delete()
        .gte('user_id', '');

      // Reset all users' hasVoted status
      await supabase
        .from('users')
        .update({ has_voted: false })
        .eq('has_voted', true);

      alert('All votes have been reset successfully!');
      fetchResults();
    } catch (error) {
      console.error('Error resetting votes:', error);
      alert('Error resetting votes. Please try again.');
    }
    setLoading(false);
  };

  const getWinner = (candidates) => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) => 
      (prev.votes || 0) > (current.votes || 0) ? prev : current
    );
  };

  if (loading) return <div className="loading">Loading results...</div>;

  return (
    <div className="results-container">
      <div className="results-header">
        <div>
          <h2>Voting Results</h2>
          <p className="total-votes">Total Votes Cast: {totalVotes}</p>
        </div>
        <div className="header-actions">
          <Link to="/admin" className="back-link">← Back to Dashboard</Link>
          <button onClick={handleResetVotes} className="reset-btn">
            RESET ALL VOTES
          </button>
        </div>
      </div>

      {results.map(roleResult => {
        const winner = getWinner(roleResult.candidates);
        return (
          <div key={roleResult.roleId} className="role-results">
            <h3>{roleResult.role}</h3>
            {roleResult.candidates.length === 0 ? (
              <p className="no-candidates">No candidates for this role</p>
            ) : (
              <div className="candidates-results">
                {roleResult.candidates.map((candidate, index) => (
                  <div 
                    key={candidate.id} 
                    className={`result-item ${index === 0 && candidate.votes > 0 ? 'leading' : ''}`}
                  >
                    <div className="result-rank">#{index + 1}</div>
                    <div className="result-candidate">
                      {candidate.photo_url ? (
                        <img src={candidate.photo_url} alt={candidate.name} />
                      ) : (
                        <div className="result-placeholder">
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                      <div className="candidate-details">
                        <h4>{candidate.name}</h4>
                        <p>{candidate.study_info || 'No info'}</p>
                      </div>
                    </div>
                    <div className="result-votes-section">
                      <div className="vote-bar-container">
                        <div className="vote-bar">
                          <div 
                            className="vote-fill" 
                            style={{ 
                              width: `${candidate.percentage}%`,
                              background: index === 0 && candidate.votes > 0 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                            }}
                          />
                        </div>
                      </div>
                      <div className="vote-stats">
                        <span className="vote-count">{candidate.votes || 0} votes</span>
                        <span className="vote-percentage">{candidate.percentage}%</span>
                      </div>
                      {index === 0 && candidate.votes > 0 && (
                        <span className="winner-badge">Leading</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Pie Charts Section */}
      <div className="pie-charts-grid">
        {results.map(roleResult => (
          <div key={roleResult.roleId} className="pie-chart-container">
            <RolePieChart roleData={{
              name: roleResult.role,
              candidates: roleResult.candidates
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteResults;




// import React, { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
// import { Link } from 'react-router-dom';
// import './Admin.css';

// const VoteResults = () => {
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalVotes, setTotalVotes] = useState(0);

//   useEffect(() => {
//     fetchResults();
    
//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('vote-updates')
//       .on('postgres_changes', { 
//         event: '*', 
//         schema: 'public', 
//         table: 'votes' 
//       }, () => {
//         fetchResults();
//       })
//       .subscribe();

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   const fetchResults = async () => {
//     try {
//       // Fetch all roles with candidates
//       const { data: rolesData } = await supabase
//         .from('roles')
//         .select('*, candidates(*)')
//         .order('order_index');

//       // Fetch total votes
//       const { count } = await supabase
//         .from('votes')
//         .select('*', { count: 'exact', head: true });

//       setTotalVotes(count || 0);

//       // Organize results by role
//       const formattedResults = rolesData?.map(role => ({
//         role: role.name,
//         roleId: role.id,
//         candidates: role.candidates
//           .sort((a, b) => (b.votes || 0) - (a.votes || 0))
//           .map(candidate => ({
//             ...candidate,
//             percentage: totalVotes > 0 ? ((candidate.votes || 0) / totalVotes * 100).toFixed(1) : 0
//           }))
//       })) || [];

//       setResults(formattedResults);
//     } catch (error) {
//       console.error('Error fetching results:', error);
//     }
//     setLoading(false);
//   };

//   const handleResetVotes = async () => {
//     if (!window.confirm('Are you sure you want to reset all votes? This action cannot be undone!')) {
//       return;
//     }

//     setLoading(true);
//     try {
//       // Reset all candidate vote counts
//       await supabase
//         .from('candidates')
//         .update({ votes: 0 })
//         .gte('votes', 0);

//       // Delete all vote records
//       await supabase
//         .from('votes')
//         .delete()
//         .gte('id', '00000000-0000-0000-0000-000000000000');

//       // Delete all user votes
//       await supabase
//         .from('user_votes')
//         .delete()
//         .gte('user_id', '');

//       // Reset all users' hasVoted status
//       await supabase
//         .from('users')
//         .update({ has_voted: false })
//         .eq('has_voted', true);

//       alert('All votes have been reset successfully!');
//       fetchResults();
//     } catch (error) {
//       console.error('Error resetting votes:', error);
//       alert('Error resetting votes. Please try again.');
//     }
//     setLoading(false);
//   };

//   const getWinner = (candidates) => {
//     if (candidates.length === 0) return null;
//     return candidates.reduce((prev, current) => 
//       (prev.votes || 0) > (current.votes || 0) ? prev : current
//     );
//   };

//   if (loading) return <div className="loading">Loading results...</div>;

//   return (
//     <div className="results-container">
//       <div className="results-header">
//         <div>
//           <h2>Voting Results</h2>
//           <p className="total-votes">Total Votes Cast: {totalVotes}</p>
//         </div>
//         <div className="header-actions">
//           <Link to="/admin" className="back-link">← Back to Dashboard</Link>
//           <button onClick={handleResetVotes} className="reset-btn">
//             Reset All Votes
//           </button>
//         </div>
//       </div>

//       {results.map(roleResult => {
//         const winner = getWinner(roleResult.candidates);
//         return (
//           <div key={roleResult.roleId} className="role-results">
//             <h3>{roleResult.role}</h3>
//             {roleResult.candidates.length === 0 ? (
//               <p className="no-candidates">No candidates for this role</p>
//             ) : (
//                 <div className="candidates-results">
//                 {roleResult.candidates.map((candidate, index) => (
//                   <div key={candidate.id} className={`result-item ${candidate.id === winner?.id ? 'winner' : ''}`}>
//                     <div className="result-rank">#{index + 1}</div>
//                     <div className="result-candidate">
//                       {candidate.photo_url && (
//                         <img src={candidate.photo_url} alt={candidate.name} />
//                       )}
//                       <div className="candidate-details">
//                         <h4>{candidate.name}</h4>
//                         <p>{candidate.study_info}</p>
//                       </div>
//                     </div>
//                     <div className="result-votes">
//                       <div className="vote-bar">
//                         <div 
//                           className="vote-fill" 
//                           style={{ width: `${candidate.percentage}%` }}
//                         />
//                       </div>
//                       <div className="vote-stats">
//                         <span className="vote-count">{candidate.votes || 0} votes</span>
//                         <span className="vote-percentage">{candidate.percentage}%</span>
//                       </div>
//                       {candidate.id === winner?.id && candidate.votes > 0 && (
//                         <span className="winner-badge">Leading</span>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default VoteResults;
