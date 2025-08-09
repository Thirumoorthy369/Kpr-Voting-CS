import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const cleanupStaleSessions = async () => {
    // Clean up sessions older than 2 hours
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    await supabase
      .from('active_sessions')
      .delete()
      .lt('started_at', twoHoursAgo.toISOString());
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedVotingState = localStorage.getItem('votingState');
    
    // Clean up stale sessions on component mount
    cleanupStaleSessions();
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAdmin(userData.isAdmin || false);
    }
    
    if (savedVotingState) {
      const votingState = JSON.parse(savedVotingState);
      // Restore voting state if needed
      if (votingState.inProgress && votingState.currentRole) {
        // Navigate back to the current role if voting was in progress
        window.location.href = `/voting/role/${votingState.currentRole}`;
      }
    }
    
    setLoading(false);
  }, []);

  const loginAsAdmin = async (id, password) => {
    if (id === import.meta.env.VITE_ADMIN_ID && 
        password === import.meta.env.VITE_ADMIN_PASSWORD) {
      const adminData = { id, isAdmin: true, name: 'Administrator' };
      setUser(adminData);
      setIsAdmin(true);
      localStorage.setItem('user', JSON.stringify(adminData));
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials' };
  };

  const loginAsUser = async (userId, password, users) => {
    if (users[userId] && users[userId].password === password) {
      // Check for active sessions
      const { data: activeSession } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (activeSession) {
        return { success: false, error: 'User is already logged in and in voting process' };
      }

      // Always check current status from database
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      let hasVoted = false;
      
      if (existingUser) {
        hasVoted = existingUser.has_voted;
      } else {
        // Create user if doesn't exist
        await supabase
          .from('users')
          .insert([{
            id: userId,
            name: users[userId].name,
            has_voted: false
          }]);
      }
      
      const userData = {
        id: userId,
        name: users[userId].name,
        isAdmin: false,
        hasVoted
      };

      // Create active session
      await supabase
        .from('active_sessions')
        .insert([{
          user_id: userId,
          started_at: new Date().toISOString()
        }]);
      
      setUser(userData);
      setIsAdmin(false);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, hasVoted };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = async () => {
    if (user && !user.isAdmin) {
      // Remove active session
      await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', user.id);
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
  };

  const updateUserVoteStatus = async () => {
    if (user && !user.isAdmin) {
      await supabase
        .from('users')
        .update({ has_voted: true })
        .eq('id', user.id);
      
      const updatedUser = { ...user, hasVoted: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    loginAsAdmin,
    loginAsUser,
    logout,
    updateUserVoteStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};




// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { supabase, db } from '../lib/supabase';

// const AuthContext = createContext({});

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get initial session
//     const getInitialSession = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session?.user) {
//         await loadUserProfile(session.user);
//       }
//       setLoading(false);
//     };

//     getInitialSession();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (session?.user) {
//           await loadUserProfile(session.user);
//         } else {
//           setUser(null);
//         }
//         setLoading(false);
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   const loadUserProfile = async (authUser) => {
//     try {
//       const { data: profile, error } = await db.getUser(authUser.id);
//       if (error && error.code !== 'PGRST116') {
//         console.error('Error loading user profile:', error);
//         return;
//       }

//       setUser({
//         id: authUser.id,
//         email: authUser.email,
//         role: profile?.role || 'voter',
//         full_name: profile?.full_name || '',
//         student_id: profile?.student_id || '',
//         ...profile
//       });
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//     }
//   };

//   const signUp = async (email, password, metadata = {}) => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: metadata
//         }
//       });

//       if (error) throw error;
//       return { data, error: null };
//     } catch (error) {
//       console.error('Error signing up:', error);
//       return { data: null, error };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signIn = async (email, password) => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password
//       });

//       if (error) throw error;
//       return { data, error: null };
//     } catch (error) {
//       console.error('Error signing in:', error);
//       return { data: null, error };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signOut = async () => {
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       setUser(null);
//       return { error: null };
//     } catch (error) {
//       console.error('Error signing out:', error);
//       return { error };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateProfile = async (updates) => {
//     setLoading(true);
//     try {
//       const { data, error } = await db.updateUserProfile(user.id, updates);
//       if (error) throw error;
      
//       setUser(prev => ({ ...prev, ...updates }));
//       return { data, error: null };
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       return { data: null, error };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const value = {
//     user,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     updateProfile
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { supabase } from '../lib/supabase';

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedUser = localStorage.getItem('user');
//     if (savedUser) {
//       const userData = JSON.parse(savedUser);
//       setUser(userData);
//       setIsAdmin(userData.isAdmin || false);
//     }
//     setLoading(false);
//   }, []);

//   const loginAsAdmin = async (id, password) => {
//     if (id === import.meta.env.VITE_ADMIN_ID && 
//         password === import.meta.env.VITE_ADMIN_PASSWORD) {
//       const adminData = { id, isAdmin: true };
//       setUser(adminData);
//       setIsAdmin(true);
//       localStorage.setItem('user', JSON.stringify(adminData));
//       return { success: true };
//     }
//     return { success: false, error: 'Invalid admin credentials' };
//   };

//   const loginAsUser = async (userId, password, users) => {
//     if (users[userId] && users[userId].password === password) {
//       // Check if user exists in Supabase
//       const { data: existingUser, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       let hasVoted = false;
      
//       if (!existingUser && !error) {
//         // Create user if doesn't exist
//         await supabase
//           .from('users')
//           .insert([{
//             id: userId,
//             name: users[userId].name,
//             has_voted: false
//           }]);
//       } else if (existingUser) {
//         hasVoted = existingUser.has_voted;
//       }
      
//       const userData = {
//         id: userId,
//         name: users[userId].name,
//         isAdmin: false,
//         hasVoted
//       };
      
//       setUser(userData);
//       setIsAdmin(false);
//       localStorage.setItem('user', JSON.stringify(userData));
      
//       return { success: true, hasVoted };
//     }
//     return { success: false, error: 'Invalid credentials' };
//   };

//   const logout = () => {
//     setUser(null);
//     setIsAdmin(false);
//     localStorage.removeItem('user');
//   };

//   const value = {
//     user,
//     isAdmin,
//     loading,
//     loginAsAdmin,
//     loginAsUser,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
