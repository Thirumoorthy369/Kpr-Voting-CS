import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { users } from '../../utils/userData';
import { supabase } from '../../lib/supabase';
import './Login.css';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginAsAdmin, loginAsUser } = useAuth();
  const navigate = useNavigate();

  // Handle user ID input with uppercase conversion
  const handleUserIdChange = (e) => {
    const uppercaseValue = e.target.value.toUpperCase();
    setUserId(uppercaseValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ensure userId is uppercase for comparison
      const uppercaseUserId = userId.toUpperCase().trim();
      
      // Check if admin
      const adminResult = await loginAsAdmin(uppercaseUserId, password);
      if (adminResult.success) {
        navigate('/admin');
        return;
      }

      // Check if user
      const userResult = await loginAsUser(uppercaseUserId, password, users);
      if (userResult.success) {
        if (userResult.hasVoted) {
          navigate('/thank-you');
        } else {
          // Get the first role (President) and navigate directly to it
          const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .order('order_index')
            .limit(1);
          
          if (rolesError) {
            console.error('Error fetching roles:', rolesError);
            setError('Error loading voting system. Please try again.');
            setLoading(false);
            return;
          }
          
          if (roles && roles.length > 0) {
            navigate(`/voting/role/${roles[0].id}`);
          } else {
            setError('No voting positions available. Please contact administrator.');
          }
        }
        return;
      }

      setError('Invalid credentials');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* <h1>KPI Voting System</h1> */}
        <h1>Login</h1>
        <p className="login-subtitle">Cast your vote for student council</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              placeholder="Enter your ID"
              value={userId}
              onChange={handleUserIdChange}
              onInput={handleUserIdChange}
              required
              autoComplete="username"
              className="uppercase-input"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Optional: Add hint for development/testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="login-hint">
            <p>Test Credentials:</p>
            <small>Admin: ADMIN / secretpassword</small><br/>
            <small>Student: 23BCS01 / kprcas123</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;



// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { users } from '../../utils/userData';
// import { supabase } from '../../lib/supabase';
// import './Login.css';

// const Login = () => {
//   const [userId, setUserId] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const { loginAsAdmin, loginAsUser } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       // Check if admin
//       const adminResult = await loginAsAdmin(userId, password);
//       if (adminResult.success) {
//         navigate('/admin');
//         return;
//       }

//       // Check if user
//       const userResult = await loginAsUser(userId, password, users);
//       if (userResult.success) {
//         if (userResult.hasVoted) {
//           navigate('/thank-you');
//         } else {
//           // Get the first role (President) and navigate directly to it
//           const { data: roles, error: rolesError } = await supabase
//             .from('roles')
//             .select('*')
//             .order('order_index')
//             .limit(1);
          
//           if (rolesError) {
//             console.error('Error fetching roles:', rolesError);
//             setError('Error loading voting system. Please try again.');
//             setLoading(false);
//             return;
//           }
          
//           if (roles && roles.length > 0) {
//             navigate(`/voting/role/${roles[0].id}`);
//           } else {
//             setError('No voting positions available. Please contact administrator.');
//           }
//         }
//         return;
//       }

//       setError('Invalid credentials');
//     } catch (err) {
//       console.error('Login error:', err);
//       setError('An error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="login-card">
//         <h1>KPI Voting System</h1>
//         <p className="login-subtitle">Cast your vote for student council</p>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>User ID</label>
//             <input
//               type="text"
//               placeholder="Enter your ID"
//               value={userId}
//               onChange={(e) => setUserId(e.target.value.toUpperCase())}
//               required
//               autoComplete="username"
//             />
//           </div>
//           <div className="form-group">
//             <label>Password</label>
//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               autoComplete="current-password"
//             />
//           </div>
//           {error && <div className="error">{error}</div>}
//           <button type="submit" disabled={loading}>
//             {loading ? 'Logging in...' : 'Login'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;


