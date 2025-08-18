import React, { useState, useEffect } from 'react';
import { socket, onHandRaised, onHandLowered } from '../utils/socket';
import apiCall from '../utils/api';

const SessionView = ({ session, user, onLeave }) => {
  const [participants, setParticipants] = useState(session.participants || []);
  const [host, setHost] = useState(session.hostedBy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});

  const handleRaiseHand = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/sessions/${session._id}/raise-hand`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        setHandRaised(true);
      } else {
        setError(data.message || 'Failed to raise hand');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLowerHand = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/sessions/${session._id}/lower-hand`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        setHandRaised(false);
      } else {
        setError(data.message || 'Failed to lower hand');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRaisedHands = async () => {
    try {
      const response = await apiCall(`/api/sessions/${session._id}/raised-hands`);
      const data = await response.json();
      if (data.success) {
        const handsMap = data.raisedHands.reduce((acc, hand) => {
          acc[hand.user._id] = hand.raisedAt;
          return acc;
        }, {});
        setRaisedHands(handsMap);
        setHandRaised(!!handsMap[user.id]);
      }
    } catch (error) {
      console.error('Error fetching raised hands:', error);
    }
  };

  useEffect(() => {
    // Connect to socket and join session room
    socket.connect();
    socket.emit('join-session', { sessionId: session._id, userId: user.id });

    // Initial fetch of raised hands
    fetchRaisedHands();

    // Listen for session updates
    socket.on('session-updated', ({ participants, host }) => {
      setParticipants(participants);
      setHost(host);
    });

    // Listen for session end
    socket.on('session-ended', () => {
      onLeave && onLeave();
    });

    // Listen for hand raise/lower events
    onHandRaised(({ userId, timestamp }) => {
      setRaisedHands(prev => ({
        ...prev,
        [userId]: timestamp
      }));
      if (userId === user.id) {
        setHandRaised(true);
      }
    });

    onHandLowered(({ userId }) => {
      setRaisedHands(prev => {
        const newHands = { ...prev };
        delete newHands[userId];
        return newHands;
      });
      if (userId === user.id) {
        setHandRaised(false);
      }
    });

    return () => {
      // Cleanup socket listeners and leave session
      socket.off('session-updated');
      socket.off('session-ended');
      socket.emit('leave-session', { sessionId: session._id, userId: user.id });
      socket.disconnect();
    };
  }, [session._id, user.id]);

  const handleLeaveSession = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/sessions/${session._id}/leave`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('leave-session', { sessionId: session._id, userId: user.id });
        onLeave && onLeave();
      } else {
        setError(data.message || 'Failed to leave session');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (loading || !window.confirm('Are you sure you want to end this session?')) return;
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/sessions/${session._id}/end`, {
        method: 'PUT'
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('end-session', session._id);
        onLeave && onLeave();
      } else {
        setError(data.message || 'Failed to end session');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isHost = host && host._id === user.id;
  const isTeacherOrAdmin = ['teacher', 'admin'].includes(user.role);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ marginBottom: '5px' }}>{session.title}</h2>
          <div style={{ 
            display: 'inline-block',
            backgroundColor: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#495057'
          }}>
            Session Code: <strong>{session.sessionCode}</strong>
          </div>
        </div>
        <div>
          <div>
            {/* Show Leave Session button for teachers/admins who are not hosts */}
            {!isHost && isTeacherOrAdmin && (
              <button
                onClick={handleLeaveSession}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Leave Session
              </button>
            )}

            {/* Show End Session button for hosts and teachers/admins */}
            {(isHost || isTeacherOrAdmin) && (
              <button
                onClick={handleEndSession}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                End Session
              </button>
            )}

            {/* Show Leave Session button for regular participants */}
            {!isHost && !isTeacherOrAdmin && (
              <button
                onClick={handleLeaveSession}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Leave Session
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* Main session area (can be used for code editor later) */}
        <div style={{ 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '400px'
        }}>
          <h3>Session Content</h3>
          {/* Add code editor or other content here */}
        </div>

        {/* Participants sidebar */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3>Participants ({participants.length})</h3>
          <div style={{ marginTop: '10px' }}>
            {/* Host */}
            <div style={{ marginBottom: '15px' }}>
              <strong>Host:</strong>
              <div style={{
                padding: '8px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginTop: '5px'
              }}>
                {host?.fullName} {host?.idNumber && `(${host.idNumber})`}
              </div>
            </div>

            {/* Raised Hands */}
            <div style={{ marginBottom: '15px' }}>
              <strong>Raised Hands:</strong>
              {Object.keys(raisedHands).length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', marginTop: '5px' }}>
                  No hands raised
                </p>
              ) : (
                <div style={{ marginTop: '5px' }}>
                  {Object.entries(raisedHands)
                    .sort((a, b) => new Date(a[1]) - new Date(b[1]))
                    .map(([userId, timestamp]) => {
                      const participant = participants.find(p => p._id === userId);
                      if (!participant) return null;
                      return (
                        <div
                          key={userId}
                          style={{
                            padding: '8px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '4px',
                            marginBottom: '5px'
                          }}
                        >
                          🖐 {participant.fullName}
                          <div style={{ 
                            fontSize: '12px',
                            color: '#666',
                            marginTop: '2px'
                          }}>
                            Raised at {new Date(timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Raise Hand Button for students */}
            {user.role === 'student' && (
              <div style={{ marginBottom: '15px' }}>
                <button
                  onClick={handRaised ? handleLowerHand : handleRaiseHand}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: handRaised ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Please wait...' : handRaised ? '🖐 Lower Hand' : '🖐 Raise Hand'}
                </button>
              </div>
            )}

            {/* Participants list */}
            <div>
              <strong>Participants:</strong>
              {participants.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', marginTop: '5px' }}>
                  No participants yet
                </p>
              ) : (
                <div style={{ marginTop: '5px' }}>
                  {participants.map(participant => (
                    <div
                      key={participant._id}
                      style={{
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}
                    >
                      {participant.fullName}
                      {participant.idNumber && ` (${participant.idNumber})`}
                      {raisedHands[participant._id] && (
                        <span style={{ marginLeft: '5px' }}>🖐</span>
                      )}
                      <div style={{ 
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionView;
