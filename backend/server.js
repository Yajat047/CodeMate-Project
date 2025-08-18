const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// MongoDB connection
mongoose.connect(process.env.CONNECTION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/codemate')
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a session room
  socket.on('join-session', async ({ sessionId, userId }) => {
    socket.join(sessionId);
    socket.sessionId = sessionId; // Store sessionId for disconnect handling
    
    try {
      const Session = require('./models/Session');
      const User = require('./models/User');
      
      const session = await Session.findById(sessionId)
        .populate('participants', 'fullName idNumber email role')
        .populate('hostedBy', 'fullName idNumber email role');

      if (session) {
        // Notify all clients in the session about the new participant
        io.to(sessionId).emit('session-updated', {
          participants: session.participants,
          host: session.hostedBy
        });
      }
    } catch (error) {
      console.error('Error handling join-session:', error);
    }
  });

  // Leave a session room
  socket.on('leave-session', async ({ sessionId, userId }) => {
    socket.leave(sessionId);
    
    try {
      const Session = require('./models/Session');
      const session = await Session.findById(sessionId)
        .populate('participants', 'fullName idNumber email role')
        .populate('hostedBy', 'fullName idNumber email role');

      if (session) {
        // Notify all clients in the session about the participant leaving
        io.to(sessionId).emit('session-updated', {
          participants: session.participants,
          host: session.hostedBy
        });
      }
    } catch (error) {
      console.error('Error handling leave-session:', error);
    }
  });

  // Handle code updates
  socket.on('code-update', ({ sessionId, code, userId }) => {
    socket.to(sessionId).emit('code-updated', { code, userId });
  });

  // Handle session end
  socket.on('end-session', (sessionId) => {
    io.to(sessionId).emit('session-ended');
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // If user was in a session, notify others
    if (socket.sessionId) {
      try {
        const Session = require('./models/Session');
        const session = await Session.findById(socket.sessionId)
          .populate('participants', 'fullName idNumber email role')
          .populate('hostedBy', 'fullName idNumber email role');

        if (session) {
          io.to(socket.sessionId).emit('session-updated', {
            participants: session.participants,
            host: session.hostedBy
          });
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
