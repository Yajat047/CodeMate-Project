import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import SessionView from './SessionView';

const StudentDashboard = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('hosted'); // 'hosted', 'history'
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    maxParticipants: 50
  });

  const fetchMySessions = async () => {
    try {
      const response = await apiCall('/api/sessions/my-hosted');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMySessionHistory = async () => {
    try {
      const response = await apiCall('/api/sessions/my-history');
      const data = await response.json();
      if (data.success) {
        setSessionHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  useEffect(() => {
    fetchMySessions();
    fetchMySessionHistory();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await apiCall('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession)
      });

      const data = await response.json();
      if (data.success) {
        setActiveSession(data.session);
        setNewSession({ title: '', description: '', maxParticipants: 50 });
        setShowCreateForm(false);
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
      const response = await apiCall(`/api/sessions/${sessionId}/end`, {
        method: 'PUT'
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

  const handleJoinSession = async (sessionCode) => {
    try {
      const response = await apiCall('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionCode })
      });

      const data = await response.json();
      if (data.success) {
        setActiveSession(data.session);
      } else {
        setMessage(data.message || 'Failed to join session');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  const handleLeaveSession = () => {
    setActiveSession(null);
    fetchMySessions();
  };

  if (activeSession) {
    return <SessionView 
      session={activeSession} 
      user={user} 
      onLeave={handleLeaveSession}
    />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard</h1>
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

      {/* Action Buttons */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        {(['student', 'teacher', 'admin'].includes(user.role)) && (
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
        )}

        {!showCreateForm && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const code = e.target.sessionCode.value;
              if (code) handleJoinSession(code);
              e.target.sessionCode.value = '';
            }}
            style={{ display: 'flex', gap: '10px', flex: 1 }}
          >
            <input
              type="text"
              name="sessionCode"
              placeholder="Enter session code"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Join Session
            </button>
          </form>
        )}
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
                max={user.role === 'admin' ? 500 : 200}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {(user.role === 'teacher' || user.role === 'admin') && (
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  As a {user.role}, you can create larger sessions than students
                </small>
              )}
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

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          borderBottom: '2px solid #ddd', 
          marginBottom: '20px' 
        }}>
          <button
            onClick={() => setActiveTab('hosted')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'hosted' ? '2px solid #007bff' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'hosted' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'hosted' ? 'bold' : 'normal'
            }}
          >
            My Hosted Sessions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #007bff' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'history' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'history' ? 'bold' : 'normal'
            }}
          >
            Session History
          </button>
        </div>
      </div>

      {/* My Sessions */}
      <div style={{ display: activeTab === 'hosted' ? 'block' : 'none' }}>
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setActiveSession(session)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        View Session
                      </button>
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
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session History */}
      <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
        <h3>My Session History</h3>
        {sessionHistory.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No session history yet. Join or create a session to get started!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessionHistory.map((history) => (
              <div
                key={history._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    {history.title}
                  </h4>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Role:</strong> {history.participations[0].role === 'host' ? 'Host' : 'Participant'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Session Code:</strong> {history.sessionCode}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Joined:</strong> {new Date(history.participations[0].joinedAt).toLocaleString()}
                  </p>
                  {history.participations[0].leftAt && (
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Left:</strong> {new Date(history.participations[0].leftAt).toLocaleString()}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    <strong>Duration:</strong> {
                      history.participations[0].leftAt 
                        ? Math.round((new Date(history.participations[0].leftAt) - new Date(history.participations[0].joinedAt)) / (1000 * 60))
                        : 'Still active'
                    } minutes
                  </p>
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
