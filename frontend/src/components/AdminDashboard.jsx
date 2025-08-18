import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import SessionView from './SessionView';

const AdminDashboard = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    maxParticipants: 500
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [studentsRes, teachersRes, sessionsRes, statsRes] = await Promise.all([
        apiCall('/api/admin/students'),
        apiCall('/api/admin/teachers'),
        apiCall('/api/sessions/all'),
        apiCall('/api/admin/stats')
      ]);

      const [studentsData, teachersData, sessionsData, statsData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        sessionsRes.json(),
        statsRes.json()
      ]);

      if (studentsData.success) setStudents(studentsData.students);
      if (teachersData.success) setTeachers(teachersData.teachers);
      if (sessionsData.success) setSessions(sessionsData.sessions);
      if (statsData.success) setStats(statsData.stats);

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading dashboard data');
    } finally {
      setLoading(false);
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
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const response = await apiCall(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchData(); // Refresh data
      } else {
        setMessage(data.message || 'Failed to change role');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  const handleStatusToggle = async (userId) => {
    if (!window.confirm('Are you sure you want to toggle this user\'s status?')) return;

    try {
      const response = await apiCall(`/api/admin/users/${userId}/status`, {
        method: 'PUT'
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchData(); // Refresh data
      } else {
        setMessage(data.message || 'Failed to toggle status');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

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
        setNewSession({ title: '', description: '', maxParticipants: 500 });
        setShowCreateForm(false);
        fetchData(); // Refresh all data including sessions
      } else {
        setMessage(data.message || 'Failed to create session');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (activeSession) {
    return <SessionView 
      session={activeSession} 
      user={user} 
      onLeave={handleLeaveSession}
    />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Admin Dashboard</h1>
      </div>

      {/* User Info */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #ffeaa7'
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
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
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
          marginBottom: '20px',
          border: '1px solid #dc3545'
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
                max="500"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                As an admin, you can create sessions with up to 500 participants
              </small>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#dc3545',
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

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px',
        borderBottom: '1px solid #ddd'
      }}>
        {['overview', 'students', 'teachers', 'sessions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#dc3545' : 'transparent',
              color: activeTab === tab ? 'white' : '#dc3545',
              borderBottom: activeTab === tab ? '2px solid #dc3545' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px',
              textTransform: 'capitalize'
            }}
          >
            {tab} {tab === 'students' && `(${students.length})`}
            {tab === 'teachers' && `(${teachers.length})`}
            {tab === 'sessions' && `(${sessions.length})`}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <h3>System Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Users</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>{stats.users.total}</p>
            </div>
            <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Students</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#388e3c' }}>{stats.users.students}</p>
            </div>
            <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Teachers</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#f57c00' }}>{stats.users.teachers}</p>
            </div>
            <div style={{ backgroundColor: '#fce4ec', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#c2185b' }}>Total Sessions</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#c2185b' }}>{stats.sessions.total}</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4>User Status</h4>
              <p>Active: {stats.users.active}</p>
              <p>Inactive: {stats.users.inactive}</p>
              <p>Admins: {stats.users.admins}</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4>Sessions Status</h4>
              <p>Active Sessions: {stats.sessions.active}</p>
              <p>Completed Sessions: {stats.sessions.completed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div>
          <h3>Students Management</h3>
          {students.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No students found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
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
                        <button
                          onClick={() => handleRoleChange(student._id, 'teacher')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '5px'
                          }}
                        >
                          Make Teacher
                        </button>
                        <button
                          onClick={() => handleStatusToggle(student._id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: student.isActive ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === 'teachers' && (
        <div>
          <h3>Teachers Management</h3>
          {teachers.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No teachers found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{teacher.idNumber}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{teacher.fullName}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{teacher.email}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: teacher.isActive ? '#d4edda' : '#f8d7da',
                          color: teacher.isActive ? '#155724' : '#721c24',
                          fontSize: '12px'
                        }}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <button
                          onClick={() => handleRoleChange(teacher._id, 'student')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '5px'
                          }}
                        >
                          Make Student
                        </button>
                        <button
                          onClick={() => handleStatusToggle(teacher._id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: teacher.isActive ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {teacher.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <h3>Sessions Management</h3>
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
                          <>
                            <button
                              onClick={() => handleJoinSession(session.sessionCode)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginRight: '5px'
                              }}
                            >
                              Join Session
                            </button>
                          </>
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

export default AdminDashboard;
