import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import SessionView from './SessionView';

const TeacherDashboard = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    maxParticipants: 100
  });

  const fetchStudents = async () => {
    try {
      const response = await apiCall('/api/admin/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAllSessions = async () => {
    try {
      const response = await apiCall('/api/sessions/all');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
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
    fetchAllSessions();
  };

  useEffect(() => {
    fetchStudents();
    fetchAllSessions();
  }, []);

  if (activeSession) {
    return <SessionView 
      session={activeSession} 
      user={user} 
      onLeave={handleLeaveSession}
    />;
  }

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
        setNewSession({ title: '', description: '', maxParticipants: 100 });
        setShowCreateForm(false);
        fetchAllSessions();
      } else {
        setMessage(data.message || 'Failed to create session');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Teacher Dashboard</h1>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
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
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                As a teacher, you can create sessions with up to 200 participants
              </small>
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

      {/* User Info */}
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Welcome, {user.fullName}!</h3>
        <p><strong>ID:</strong> {user.idNumber} | <strong>Email:</strong> {user.email} | <strong>Role:</strong> {user.role.toUpperCase()}</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px',
        borderBottom: '1px solid #ddd'
      }}>
        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'students' ? '#28a745' : 'transparent',
            color: activeTab === 'students' ? 'white' : '#28a745',
            borderBottom: activeTab === 'students' ? '2px solid #28a745' : 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Students List ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'sessions' ? '#28a745' : 'transparent',
            color: activeTab === 'sessions' ? 'white' : '#28a745',
            borderBottom: activeTab === 'sessions' ? '2px solid #28a745' : 'none',
            cursor: 'pointer',
            fontSize: '16px',
            marginLeft: '10px'
          }}
        >
          All Sessions ({sessions.length})
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div>
          <h3>All Students</h3>
          {students.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No students found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID Number</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Full Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.idNumber}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.fullName}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{student.email}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: student.isActive ? '#d4edda' : '#f8d7da',
                          color: student.isActive ? '#155724' : '#721c24',
                          fontSize: '12px'
                        }}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <h3>All Sessions</h3>
          {sessions.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No sessions found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Host</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Session Code</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Participants</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id} style={{ backgroundColor: session.isActive ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {session.title}
                        {session.description && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                            {session.description}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {session.hostedBy?.fullName}<br />
                        <span style={{ fontSize: '12px', color: '#666' }}>({session.hostedBy?.idNumber})</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{session.sessionCode}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {session.participants.length} / {session.maxParticipants}
                        <details style={{ marginTop: '5px' }}>
                          <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '12px' }}>
                            View List
                          </summary>
                          <div style={{ marginTop: '5px', fontSize: '12px' }}>
                            {session.participants.map((participant) => (
                              <div key={participant._id} style={{ margin: '3px 0', color: '#666' }}>
                                • {participant.fullName} ({participant.idNumber})
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: session.isActive ? '#d4edda' : '#f8d7da',
                          color: session.isActive ? '#155724' : '#721c24',
                          fontSize: '12px'
                        }}>
                          {session.isActive ? 'Active' : 'Ended'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {session.isActive && (
                          <button
                            onClick={() => handleJoinSession(session.sessionCode)}
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
                            Join Session
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
