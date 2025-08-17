// Authentication utility functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Make authenticated API requests
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // If unauthorized, clear stored auth data
    if (response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.reload(); // Force reload to show login
    }
    
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

// Check if user is authenticated
export const checkAuthStatus = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/auth/me`);
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    
    // If auth check fails, clear stored data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};

// Get stored user data
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Store authentication data
export const storeAuthData = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  if (token) {
    localStorage.setItem('token', token);
  }
};
