import { useState, useEffect } from 'react'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import StudentDashboard from './components/StudentDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import AdminDashboard from './components/AdminDashboard'
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      setActiveTab('login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
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
