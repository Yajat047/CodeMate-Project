import React, { useState } from 'react';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
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
        setMessage(`Welcome, ${data.user.fullName}! Account created successfully as a ${data.user.role}.`);
        setFormData({ fullName: '', idNumber: '', email: '', password: '' });
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Signup failed');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Network error. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 className="form-title">Create Student Account</h2>
      {/*  */}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="fullName" style={{ display: 'block', marginBottom: '5px' }}>
            Full Name:
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="idNumber" style={{ display: 'block', marginBottom: '5px' }}>
            ID Number:
          </label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your ID number"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Your unique identifier (letters and numbers only)
          </small>
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter your email"
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
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating Account...' : 'Sign Up as Student'}
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

      {/* <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Role Information:</h4>
        <p><strong>Student:</strong> Default role for all new signups</p>
        <p><strong>Teaching Assistant:</strong> Must be created by admin or promoted from student</p>
      </div> */}
    </div>
  );
};

export default SignupForm;
