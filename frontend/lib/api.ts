import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For handling cookies
});

// Add auth token to requests from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      // Handle specific error statuses
      if (status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        console.error('Authentication error:', data?.message || 'Unauthorized');
      } else if (status === 403) {
        // Handle forbidden access
        console.error('Authorization error:', data?.message || 'Forbidden');
      } else if (status === 404) {
        console.error('Resource not found:', data?.message || 'Not Found');
      } else if (status >= 500) {
        console.error('Server error:', data?.message || 'Internal Server Error');
      }
      
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        data: data?.data || null,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject({
        message: error.message || 'Error setting up request',
      });
    }
  }
);

// Auth API
export const authApi = {
  // Register a new user
  register: async (userData: {
    email: string;
    password: string;
    serviceNumber?: string;
    firstName: string;
    lastName: string;
    role: 'officer' | 'family' | 'admin';
    rank?: string;
    unit?: string;
    phoneNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
    familyMembers?: Array<{
      name: string;
      relation: string;
      dob: string;
    }>;
  }) => {
    try {
      const response = await api.post('/auth/register', {
        ...userData,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        phoneNumber: userData.phoneNumber.trim(),
        address: {
          ...userData.address,
          street: userData.address.street.trim(),
          city: userData.address.city.trim(),
          state: userData.address.state.trim(),
          pincode: userData.address.pincode.trim(),
          country: userData.address.country?.trim() || 'India',
        },
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    }
  },

  // Social login
  socialLogin: async (provider: 'google' | 'microsoft', token: string) => {
    const response = await api.post('/auth/social', { provider, token });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  },

  // Get current user profile
  getProfile: async () => {
    return api.get('/auth/profile');
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    return api.put('/auth/me', profileData);
  },

  // Request password reset
  requestPasswordReset: async (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  // Verify email
  verifyEmail: async (token: string) => {
    return api.post('/auth/verify-email', { token });
  },
};

// Users API
export const usersApi = {
  // Get all users (admin only)
  getAllUsers: async (params?: { page?: number; limit?: number }) => {
    return api.get('/users', { params });
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    return api.get(`/users/${userId}`);
  },

  // Update user (admin only)
  updateUser: async (userId: string, userData: any) => {
    return api.put(`/users/${userId}`, userData);
  },

  // Delete user (admin only)
  deleteUser: async (userId: string) => {
    return api.delete(`/users/${userId}`);
  },

  // Get officers list
  getOfficers: async () => {
    return api.get('/users/officers');
  },

  // Get family members for an officer
  getFamilyMembers: async (serviceNumber: string) => {
    return api.get(`/users/officers/${serviceNumber}/family`);
  },
};

export default api;
