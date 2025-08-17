import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    maxParticipants: 50
  });

  const fetchMySessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sessions/my-hosted', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchMySessions();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSession)
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Session "${data.session.title}" created successfully! Session code: ${data.session.sessionCode}`);
        setNewSession({ title: '', description: '', maxParticipants: 50 });
        setShowCreateForm(false);
        fetchMySessions();
      } else {
        setMessage(data.message || 'Failed to create session');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this session?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/end`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Session ended successfully');
        fetchMySessions();
      } else {
        setMessage(data.message || 'Failed to end session');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Student Dashboard</h1>
      </div>

      {/* User Info */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Welcome, {user.fullName}!</h3>
        <p><strong>ID:</strong> {user.idNumber} | <strong>Email:</strong> {user.email} | <strong>Role:</strong> {user.role.toUpperCase()}</p>
      </div>

      {/* Create Session Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New Session'}
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3>Create New Session</h3>
          <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Session Title:</label>
              <input
                type="text"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Enter session title"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description (optional):</label>
              <textarea
                value={newSession.description}
                onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
                placeholder="Enter session description"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Max Participants:</label>
              <input
                type="number"
                value={newSession.maxParticipants}
                onChange={(e) => setNewSession({ ...newSession, maxParticipants: parseInt(e.target.value) })}
                min="1"
                max="200"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </form>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* My Sessions */}
      <div>
        <h3>My Hosted Sessions</h3>
        {sessions.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No sessions created yet. Create your first session above!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.map((session) => (
              <div
                key={session._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: session.isActive ? '#fff' : '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: session.isActive ? '#000' : '#666' }}>
                      {session.title}
                      {!session.isActive && <span style={{ color: '#dc3545', marginLeft: '10px' }}>(Ended)</span>}
                    </h4>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Session Code:</strong> {session.sessionCode}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Participants:</strong> {session.participants.length} / {session.maxParticipants}
                    </p>
                    {session.description && (
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Description:</strong> {session.description}
                      </p>
                    )}
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {session.isActive && (
                    <button
                      onClick={() => handleEndSession(session._id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      End Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
