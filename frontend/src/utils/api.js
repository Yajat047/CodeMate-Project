// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Token management
export const tokenManager = {
  getToken: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    // Store raw token, add Bearer in headers
    return token;
  },
  setToken: (token) => {
    if (!token) return;
    // Remove Bearer prefix if present before storing
    const cleanToken = token.replace(/^Bearer\s+/, '');
    localStorage.setItem('authToken', cleanToken);
  },
  removeToken: () => localStorage.removeItem('authToken'),
  hasToken: () => !!localStorage.getItem('authToken')
};

// API call wrapper with automatic token handling
export const apiCall = async (endpoint, options = {}) => {
  const token = tokenManager.getToken();
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add Authorization header for protected endpoints
  if (token && !endpoint.startsWith('/api/auth/login') && !endpoint.startsWith('/api/auth/signup')) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle authentication errors
    if (response.status === 401) {
      const data = await response.json();
      console.error('Auth error:', data);
      
      // Only remove token for specific scenarios
      if (endpoint === '/api/auth/me' || 
          endpoint === '/api/auth/token-refresh' ||
          data.expired || 
          data.userNotFound) {
        tokenManager.removeToken();
        window.location.href = '/';
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        // Save token immediately after successful login
        tokenManager.setToken(data.token);
        // Log token status for debugging
        console.log('Token saved after login:', tokenManager.hasToken());
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      const response = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        tokenManager.setToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await apiCall('/api/auth/logout', {
        method: 'POST'
      });
      
      tokenManager.removeToken();
      return response.json();
    } catch (error) {
      console.error('Logout error:', error);
      tokenManager.removeToken(); // Remove token even if logout fails
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      // Verify token exists before making the call
      if (!tokenManager.hasToken()) {
        throw new Error('No authentication token found');
      }
      
      const response = await apiCall('/api/auth/me');
      return response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
};

export default apiCall;
