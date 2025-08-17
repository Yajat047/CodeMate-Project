// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
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
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // If unauthorized, remove token and redirect to login
  if (response.status === 401) {
    tokenManager.removeToken();
    window.location.href = '/';
  }
  
  return response;
};

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      tokenManager.setToken(data.token);
    }
    
    return data;
  },

  signup: async (userData) => {
    const response = await apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      tokenManager.setToken(data.token);
    }
    
    return data;
  },

  logout: async () => {
    const response = await apiCall('/api/auth/logout', {
      method: 'POST'
    });
    
    tokenManager.removeToken();
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await apiCall('/api/auth/me');
    return response.json();
  }
};

export default apiCall;
