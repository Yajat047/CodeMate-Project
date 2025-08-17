import React, { useState, useEffect } from 'react';

const TeacherDashboard = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        credentials: 'include'
      });
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sessions/all`, {
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
    fetchStudents();
    fetchAllSessions();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Teacher Dashboard</h1>
      </div>

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

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <h3>All Sessions</h3>
          {sessions.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No sessions found.</p>
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
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 10px 0', color: session.isActive ? '#000' : '#666' }}>
                        {session.title}
                        {!session.isActive && <span style={{ color: '#dc3545', marginLeft: '10px' }}>(Ended)</span>}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                        <p style={{ margin: '0', color: '#666' }}>
                          <strong>Host:</strong> {session.hostedBy?.fullName} ({session.hostedBy?.idNumber})
                        </p>
                        <p style={{ margin: '0', color: '#666' }}>
                          <strong>Session Code:</strong> {session.sessionCode}
                        </p>
                        <p style={{ margin: '0', color: '#666' }}>
                          <strong>Participants:</strong> {session.participants.length} / {session.maxParticipants}
                        </p>
                        <p style={{ margin: '0', color: '#666' }}>
                          <strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {session.description && (
                        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                          <strong>Description:</strong> {session.description}
                        </p>
                      )}
                      {session.participants.length > 0 && (
                        <details style={{ marginTop: '10px' }}>
                          <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                            View Participants ({session.participants.length})
                          </summary>
                          <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                            {session.participants.map((participant) => (
                              <p key={participant._id} style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                                • {participant.fullName} ({participant.idNumber}) - {participant.email}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
