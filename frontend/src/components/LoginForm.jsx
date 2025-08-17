import React, { useState } from 'react';

const LoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    emailOrId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setUser(data.user);
        setMessage(`Welcome back, ${data.user.fullName}!`);
        setFormData({ emailOrId: '', password: '' });
        
        // Call the success callback to update parent component
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Login failed');
        setUser(null);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Network error. Please make sure the backend server is running.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setUser(null);
        setMessage('Logged out successfully');
        setIsSuccess(true);
      }
    } catch (error) {
      setMessage('Logout failed');
      setIsSuccess(false);
    }
  };

  if (user) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h2>Welcome, {user.fullName}!</h2>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <p><strong>ID Number:</strong> {user.idNumber}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role.replace('_', ' ').toUpperCase()}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 className="form-title">Login</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="emailOrId" style={{ display: 'block', marginBottom: '5px' }}>
            Email or ID Number:
          </label>
          <input
            type="text"
            id="emailOrId"
            name="emailOrId"
            value={formData.emailOrId}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your email or ID number"
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            border: `1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {message}
        </div>
      )}

      
    </div>
  );
};

export default LoginForm;
