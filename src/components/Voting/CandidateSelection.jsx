import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './Voting.css';

const CandidateSelection = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [nextRole, setNextRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { roleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset component state when roleId changes
  useEffect(() => {
    // Reset state for new role
    setSelectedCandidate(null);
    setLoading(true);
    setSubmitting(false);
    setCandidates([]);
    setRole(null);
    setNextRole(null);
    
    // Load new role data
    if (roleId && user?.id) {
      loadRoleData();
    }
  }, [roleId, user?.id]); // Depend on roleId and user.id changes

  const loadRoleData = async () => {
    try {
      // Check if already voted for this role
      const { data: existingVote } = await supabase
        .from('user_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_id', roleId)
        .maybeSingle();

      if (existingVote) {
        // Already voted, find next role
        await navigateToNextUnvotedRole();
        return;
      }

      // Fetch role information
      const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .order('order_index');
      
      const currentRole = roles.find(r => r.id === roleId);
      if (!currentRole) {
        console.error('Role not found');
        navigate('/', { replace: true });
        return;
      }
      
      setRole(currentRole);
      
      // Find next role
      const currentIndex = roles.findIndex(r => r.id === roleId);
      if (currentIndex < roles.length - 1) {
        setNextRole(roles[currentIndex + 1]);
      }
      
      // Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('role_id', roleId)
        .order('created_at');
      
      if (candidatesError) {
        console.error('Error fetching candidates:', candidatesError);
      } else {
        setCandidates(candidatesData || []);
      }
      
    } catch (error) {
      console.error('Error loading role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToNextUnvotedRole = async () => {
    try {
      const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .order('order_index');
      
      const currentIndex = roles.findIndex(r => r.id === roleId);
      
      // Find next unvoted role
      for (let i = currentIndex + 1; i < roles.length; i++) {
        const { data: vote } = await supabase
          .from('user_votes')
          .select('*')
          .eq('user_id', user.id)
          .eq('role_id', roles[i].id)
          .maybeSingle();
        
        if (!vote) {
          // Navigate to next unvoted role
          navigate(`/voting/role/${roles[i].id}`, { replace: true });
          return;
        }
      }
      
      // All roles voted, mark as complete and go to thank you
      await supabase
        .from('users')
        .update({ has_voted: true })
        .eq('id', user.id);
      
      navigate('/thank-you', { replace: true });
      
    } catch (error) {
      console.error('Error navigating to next role:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || submitting) return;
    
    setSubmitting(true);
    
    try {
      // Record the vote in votes table only - we'll count from this table
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{
          user_id: user.id,
          candidate_id: selectedCandidate.id,
          role_id: roleId,
          timestamp: new Date().toISOString()
        }]);
      
      if (voteError) throw voteError;
      
      // Record user's vote for this role
      const { error: userVoteError } = await supabase
        .from('user_votes')
        .insert([{
          user_id: user.id,
          role_id: roleId,
          candidate_id: selectedCandidate.id
        }]);
      
      if (userVoteError) throw userVoteError;
      
      // Success - navigate to next role
      await navigateToNextUnvotedRole();
      
    } catch (error) {
      console.error('Error recording vote:', error);
      alert('Error recording vote. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    await navigateToNextUnvotedRole();
  };

  // Loading state
  if (loading) {
    return (
      <div className="voting-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  // No candidates state
  if (candidates.length === 0) {
    return (
      <div className="voting-container">
        <div className="voting-header">
          <h2>Vote for {role?.name}</h2>
        </div>
        <div className="no-candidates">
          <p>No candidates available for this position.</p>
          <button 
            onClick={handleSkip}
            className="skip-button"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Continue to Next Position'}
          </button>
        </div>
      </div>
    );
  }

  // Normal voting state
  return (
    <div className="voting-container">
      <div className="voting-header">
        <h2>Vote for {role?.name}</h2>
        <p>Select your preferred candidate</p>
      </div>
      
      <div className="candidates-grid">
        {candidates.map((candidate, index) => (
          <div 
            key={candidate.id} 
            className={`candidate-card-container ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
            onClick={() => {
              if (!submitting) {
                setSelectedCandidate(candidate);
              }
            }}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="candidate-card">
              {selectedCandidate?.id === candidate.id && (
                <div className="selected-indicator">
                  <span>✓</span>
                </div>
              )}
              <div className="candidate-image-wrapper">
                {candidate.photo_url ? (
                  <img 
                    src={candidate.photo_url} 
                    alt={candidate.name}
                    className="candidate-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="candidate-placeholder" 
                  style={{ display: candidate.photo_url ? 'none' : 'flex' }}
                >
                  <span>{candidate.name.charAt(0)}</span>
                </div>
              </div>
              <div className="candidate-details">
                <h3 className="candidate-name">{candidate.name}</h3>
                <p className="candidate-info">{candidate.study_info || 'No info available'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="voting-actions">
        <button 
          className="vote-button"
          onClick={handleVote}
          disabled={!selectedCandidate || submitting}
        >
          {submitting ? 'Processing Vote...' : 'Cast Your Vote'}
        </button>
        {nextRole && (
          <p className="next-info">Next Position: {nextRole.name}</p>
        )}
      </div>
    </div>
  );
};

export default CandidateSelection;




// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../context/AuthContext';
// import './Voting.css';

// const CandidateSelection = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [selectedCandidate, setSelectedCandidate] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState(null);
//   const [nextRole, setNextRole] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [hasVotedForThisRole, setHasVotedForThisRole] = useState(false);
  
//   const { roleId } = useParams();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     checkVoteStatusAndFetchData();
//   }, [roleId, user.id]);

//   const checkVoteStatusAndFetchData = async () => {
//     if (!roleId || !user?.id) return;
    
//     try {
//       // Check if user has already voted for this role
//       const { data: existingVote } = await supabase
//         .from('user_votes')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('role_id', roleId)
//         .maybeSingle();

//       if (existingVote) {
//         // User already voted for this role, skip to next
//         setHasVotedForThisRole(true);
//         await findAndNavigateToNext();
//       } else {
//         await fetchRoleAndCandidates();
//       }
//     } catch (error) {
//       console.error('Error checking vote status:', error);
//       await fetchRoleAndCandidates();
//     }
//   };

//   const findAndNavigateToNext = async () => {
//     const { data: roles } = await supabase
//       .from('roles')
//       .select('*')
//       .order('order_index');
    
//     const currentIndex = roles.findIndex(r => r.id === roleId);
    
//     // Find next unvoted role
//     for (let i = currentIndex + 1; i < roles.length; i++) {
//       const { data: vote } = await supabase
//         .from('user_votes')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('role_id', roles[i].id)
//         .maybeSingle();
      
//       if (!vote) {
//         navigate(`/voting/role/${roles[i].id}`, { replace: true });
//         return;
//       }
//     }
    
//     // All roles voted, go to thank you
//     await supabase
//       .from('users')
//       .update({ has_voted: true })
//       .eq('id', user.id);
    
//     navigate('/thank-you', { replace: true });
//   };

//   const fetchRoleAndCandidates = async () => {
//     try {
//       const { data: roles } = await supabase
//         .from('roles')
//         .select('*')
//         .order('order_index');
      
//       const currentRole = roles.find(r => r.id === roleId);
//       setRole(currentRole);
      
//       const currentIndex = roles.findIndex(r => r.id === roleId);
//       if (currentIndex < roles.length - 1) {
//         setNextRole(roles[currentIndex + 1]);
//       }
      
//       const { data: candidatesData } = await supabase
//         .from('candidates')
//         .select('*')
//         .eq('role_id', roleId)
//         .order('created_at');
        
//       setCandidates(candidatesData || []);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//     setLoading(false);
//   };

//   const handleVote = async () => {
//     if (!selectedCandidate || submitting) return;
    
//     setSubmitting(true);
//     try {
//       // Record the vote
//       await supabase
//         .from('votes')
//         .insert([{
//           user_id: user.id,
//           candidate_id: selectedCandidate.id,
//           role_id: roleId,
//           timestamp: new Date().toISOString()
//         }]);
      
//       // Update candidate vote count
//       await supabase
//         .from('candidates')
//         .update({ votes: (selectedCandidate.votes || 0) + 1 })
//         .eq('id', selectedCandidate.id);
      
//       // Record user's vote for this role
//       await supabase
//         .from('user_votes')
//         .insert([{
//           user_id: user.id,
//           role_id: roleId,
//           candidate_id: selectedCandidate.id
//         }]);
      
//       // Navigate to next role
//       await findAndNavigateToNext();
      
//     } catch (error) {
//       console.error('Error recording vote:', error);
//       alert('Error recording vote. Please try again.');
//       setSubmitting(false);
//     }
//   };

//   if (loading) return <div className="loading">Loading candidates...</div>;
  
//   if (hasVotedForThisRole) {
//     return <div className="loading">Redirecting to next position...</div>;
//   }

//   return (
//     <div className="voting-container">
//       <div className="voting-header">
//         <h2>Vote for {role?.name}</h2>
//         <p>Select your preferred candidate</p>
//       </div>
      
//       {candidates.length === 0 ? (
//         <div className="no-candidates">
//           <p>No candidates available for this position.</p>
//           <button 
//             onClick={findAndNavigateToNext}
//             className="skip-button"
//           >
//             Continue to Next Position
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="candidates-grid">
//             {candidates.map((candidate, index) => (
//               <div 
//                 key={candidate.id} 
//                 className={`candidate-card-container ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
//                 onClick={() => !submitting && setSelectedCandidate(candidate)}
//                 style={{ animationDelay: `${index * 0.1}s` }}
//               >
//                 <div className="candidate-card">
//                   {selectedCandidate?.id === candidate.id && (
//                     <div className="selected-indicator">
//                       <span>✓</span>
//                     </div>
//                   )}
//                   <div className="candidate-image-wrapper">
//                     {candidate.photo_url ? (
//                       <img 
//                         src={candidate.photo_url} 
//                         alt={candidate.name}
//                         className="candidate-image"
//                       />
//                     ) : (
//                       <div className="candidate-placeholder">
//                         <span>{candidate.name.charAt(0)}</span>
//                       </div>
//                     )}
//                   </div>
//                   <div className="candidate-details">
//                     <h3 className="candidate-name">{candidate.name}</h3>
//                     <p className="candidate-info">{candidate.study_info || 'No info available'}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           <div className="voting-actions">
//             <button 
//               className="vote-button"
//               onClick={handleVote}
//               disabled={!selectedCandidate || submitting}
//             >
//               {submitting ? 'Processing Vote...' : 'Cast Your Vote'}
//             </button>
//             {nextRole && (
//               <p className="next-info">Next Position: {nextRole.name}</p>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default CandidateSelection;



