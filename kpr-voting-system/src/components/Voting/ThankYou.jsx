import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import './Voting.css';

const ThankYou = () => {
  const [votes, setVotes] = useState([]);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserVotes();
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [logout, navigate]);

  const fetchUserVotes = async () => {
    try {
      const { data: votesData } = await supabase
        .from('user_votes')
        .select(`
          role_id,
          candidate_id,
          candidates (
            id,
            name,
            study_info,
            photo_url
          ),
          roles (
            id,
            name,
            order_index
          )
        `)
        .eq('user_id', user.id)
        .order('roles(order_index)');

      if (votesData) {
        const formattedVotes = votesData
          .filter(vote => vote.candidates && vote.roles)
          .map(vote => ({
            role: vote.roles.name,
            roleOrder: vote.roles.order_index,
            candidate: {
              id: vote.candidates.id,
              name: vote.candidates.name,
              studyInfo: vote.candidates.study_info,
              photoUrl: vote.candidates.photo_url
            }
          }))
          .sort((a, b) => a.roleOrder - b.roleOrder);
        
        setVotes(formattedVotes);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutNow = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="loading">Loading your votes...</div>;
  }

  return (
    <div className="thank-you-container">
      <div className="thank-you-content">
        <div className="thank-you-header">
          <div className="success-icon">
            <span>✓</span>
          </div>
          <h1>Thank You for Voting!</h1>
          <p className="user-greeting">Dear {user.name},</p>
          <p className="thank-you-message">
            Your votes have been successfully recorded. Thank you for participating in the KPI student council elections.
          </p>
        </div>
        
        <div className="votes-summary">
          <h2>Your Voting Summary</h2>
          <div className="voted-candidates-grid">
            {votes.map((vote, index) => (
              <div key={index} className="voted-candidate-card">
                <div className="vote-role-header">
                  <span className="role-label">{vote.role}</span>
                </div>
                <div className="voted-candidate-content">
                  <div className="voted-candidate-image">
                    {vote.candidate.photoUrl ? (
                      <img 
                        src={vote.candidate.photoUrl} 
                        alt={vote.candidate.name}
                      />
                    ) : (
                      <div className="voted-candidate-placeholder">
                        <span>{vote.candidate.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="voted-candidate-info">
                    <h4>{vote.candidate.name}</h4>
                    <p>{vote.candidate.studyInfo || 'No info'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="countdown-section">
          <p className="countdown-text">
            Auto logout in <span className="countdown-number">{countdown}</span> seconds
          </p>
          <button onClick={handleLogoutNow} className="logout-now-btn">
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;




// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { supabase } from '../../lib/supabase';
// import './Voting.css';

// const ThankYou = () => {
//   const [votes, setVotes] = useState([]);
//   const [countdown, setCountdown] = useState(30);
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchUserVotes();
    
//     // Start countdown
//     const timer = setInterval(() => {
//       setCountdown(prev => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           logout();
//           navigate('/');
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [logout, navigate]);

//   const fetchUserVotes = async () => {
//     try {
//       const { data } = await supabase
//         .from('user_votes')
//         .select(`
//           role_id,
//           candidate_id,
//           roles (name),
//           candidates (name)
//         `)
//         .eq('user_id', user.id);

//       if (data) {
//         const formattedVotes = data.map(vote => ({
//           role: vote.roles?.name || 'Unknown Role',
//           candidate: vote.candidates?.name || 'Unknown Candidate'
//         }));
//         setVotes(formattedVotes);
//       }
//     } catch (error) {
//       console.error('Error fetching votes:', error);
//     }
//   };

//   return (
//     <div className="thank-you-container">
//       <div className="thank-you-card">
//         <div className="thank-you-icon">🎉</div>
//         <h1>Thank You for Voting!</h1>
//         <p className="user-greeting">Dear {user.name},</p>
//         <p className="thank-you-message">
//           Your votes have been successfully recorded. Thank you for participating in the KPR student council elections.
//         </p>
        
//         <div className="vote-summary">
//           <h3>Your Votes:</h3>
//           {votes.map((vote, index) => (
//             <div key={index} className="vote-item">
//               <span className="vote-role">{vote.role}:</span>
//               <span className="vote-candidate">{vote.candidate}</span>
//             </div>
//           ))}
//         </div>
        
//         <div className="countdown-section">
//           <p className="countdown-text">
//             Auto logout in <span className="countdown-number">{countdown}</span> seconds
//           </p>
//           <button onClick={() => {
//             logout();
//             navigate('/');
//           }} className="logout-now-btn">
//             Logout Now
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ThankYou;
