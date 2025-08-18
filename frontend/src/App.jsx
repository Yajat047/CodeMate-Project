import { useState, useEffect } from 'react'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import StudentDashboard from './components/StudentDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import AdminDashboard from './components/AdminDashboard'
import { authAPI, tokenManager } from './utils/api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('login')

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check for token using tokenManager
      if (!tokenManager.hasToken()) {
        console.log('No token found during auth check');
        setLoading(false);
        return;
      }
      
      const data = await authAPI.getCurrentUser();
      console.log('Auth check response:', data); // Debug log
      
      if (data.success && data.user) {
        setUser(data.user);
        console.log('User authenticated successfully');
      } else {
        console.log('Auth check failed:', data.message);
        tokenManager.removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      tokenManager.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setActiveTab('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login success - setting user:', userData); // Debug log
    setUser(userData);
    // Verify authentication immediately after login
    checkAuthStatus();
  }

  if (loading) {
    return (
      <div className="loading">
        Loading...
      </div>
    )
  }

  // If user is logged in, show appropriate dashboard
  if (user) {
    return (
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">CodeMate</h1>
          <div className="user-info">
            <span>Welcome, {user.fullName}</span>
            <span className="user-role">{user.role}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="dashboard-content">
          {user.role === 'student' && <StudentDashboard user={user} onLogout={handleLogout} />}
          {user.role === 'teacher' && <TeacherDashboard user={user} onLogout={handleLogout} />}
          {user.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
          {!['student', 'teacher', 'admin'].includes(user.role) && (
            <div className="message error">Unknown user role</div>
          )}
        </div>
      </div>
    )
  }

  // If user is not logged in, show auth forms
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">CodeMate</h1>
        
        {/* Tab Navigation */}
        <div className="auth-tabs">
          <button
            onClick={() => setActiveTab('login')}
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'login' ? (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          ) : (
            <SignupForm />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
