import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import ManageRoles from './components/Admin/ManageRoles';
import ManageCandidates from './components/Admin/ManageCandidates';
import VoteResults from './components/Admin/VoteResults';
import CandidateSelection from './components/Voting/CandidateSelection';
import ThankYou from './components/Voting/ThankYou';
import './App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute adminOnly={true}>
                <ManageRoles />
              </ProtectedRoute>
            } />
            <Route path="/admin/candidates" element={
              <ProtectedRoute adminOnly={true}>
                <ManageCandidates />
              </ProtectedRoute>
            } />
            <Route path="/admin/results" element={
              <ProtectedRoute adminOnly={true}>
                <VoteResults />
              </ProtectedRoute>
            } />
            
            {/* Voting Routes */}
            <Route path="/voting/role/:roleId" element={
              <ProtectedRoute>
                <CandidateSelection />
              </ProtectedRoute>
            } />
            <Route path="/thank-you" element={
              <ProtectedRoute>
                <ThankYou />
              </ProtectedRoute>
            } />
            
            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
