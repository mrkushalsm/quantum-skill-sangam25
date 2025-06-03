import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For handling cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log(`Adding token to request: ${token.substring(0, 10)}...`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No authentication token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        console.error('Authentication error:', data?.message || 'Unauthorized');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        console.error('Access forbidden:', data?.message || 'Forbidden');
      } else if (status === 500) {
        console.error('Server error:', data?.message || 'Internal server error');
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

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

// Welfare API
export const welfareApi = {
  // Get all welfare schemes
  getSchemes: async (params?: { 
    category?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
    search?: string;
  }) => {
    return api.get('/welfare/schemes', { params });
  },

  // Get specific welfare scheme
  getScheme: async (id: string) => {
    return api.get(`/welfare/schemes/${id}`);
  },

  // Apply for welfare scheme
  applyForScheme: async (schemeId: string, applicationData: any, documents?: File[]) => {
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(applicationData));
    
    if (documents) {
      documents.forEach((file, index) => {
        formData.append('documents', file);
      });
    }
    
    return api.post(`/welfare/schemes/${schemeId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get user's applications
  getMyApplications: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number;
  }) => {
    return api.get('/welfare/applications/my', { params });
  },

  // Get all applications (admin only)
  getAllApplications: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number;
    scheme?: string;
  }) => {
    return api.get('/welfare/applications', { params });
  },

  // Get application by ID
  getApplication: async (id: string) => {
    return api.get(`/welfare/applications/${id}`);
  },

  // Update application status (admin only)
  updateApplicationStatus: async (id: string, status: string, comments?: string) => {
    return api.put(`/welfare/applications/${id}/status`, { status, comments });
  },

  // Create new welfare scheme (admin only)
  createScheme: async (schemeData: any) => {
    return api.post('/welfare/schemes', schemeData);
  },

  // Update welfare scheme (admin only)
  updateScheme: async (id: string, schemeData: any) => {
    return api.put(`/welfare/schemes/${id}`, schemeData);
  },

  // Delete welfare scheme (admin only)
  deleteScheme: async (id: string) => {
    return api.delete(`/welfare/schemes/${id}`);
  },
};

// Emergency API
export const emergencyApi = {
  // Get all emergency alerts
  getAlerts: async (params?: { 
    severity?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
  }) => {
    return api.get('/emergency/alerts', { params });
  },

  // Create emergency alert
  createAlert: async (alertData: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'medical' | 'security' | 'natural_disaster' | 'other';
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    contactNumber?: string;
  }) => {
    return api.post('/emergency/alerts', alertData);
  },

  // Respond to alert
  respondToAlert: async (id: string, responseData: {
    responseType: 'acknowledged' | 'responding' | 'resolved';
    message?: string;
    estimatedArrival?: Date;
  }) => {
    return api.post(`/emergency/alerts/${id}/respond`, responseData);
  },

  // Update alert status (admin only)
  updateAlert: async (id: string, updateData: any) => {
    return api.put(`/emergency/alerts/${id}`, updateData);
  },

  // Get alert responses
  getAlertResponses: async (id: string) => {
    return api.get(`/emergency/alerts/${id}/responses`);
  },

  // Emergency contacts management
  getContacts: async () => {
    return api.get('/emergency/contacts');
  },

  addContact: async (contactData: {
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary?: boolean;
  }) => {
    return api.post('/emergency/contacts', contactData);
  },

  updateContact: async (id: string, contactData: any) => {
    return api.put(`/emergency/contacts/${id}`, contactData);
  },

  deleteContact: async (id: string) => {
    return api.delete(`/emergency/contacts/${id}`);
  },
};

// Marketplace API
export const marketplaceApi = {
  // Get all marketplace items
  getItems: async (params?: { 
    category?: string; 
    condition?: string; 
    priceRange?: { min: number; max: number }; 
    search?: string;
    page?: number; 
    limit?: number;
    location?: string;
  }) => {
    return api.get('/marketplace/items', { params });
  },

  // Create new marketplace item
  createItem: async (itemData: any, images?: File[]) => {
    const formData = new FormData();
    formData.append('itemData', JSON.stringify(itemData));
    
    if (images) {
      images.forEach((file) => {
        formData.append('images', file);
      });
    }
    
    return api.post('/marketplace/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get specific item
  getItem: async (id: string) => {
    return api.get(`/marketplace/items/${id}`);
  },

  // Update item
  updateItem: async (id: string, itemData: any, images?: File[]) => {
    const formData = new FormData();
    formData.append('itemData', JSON.stringify(itemData));
    
    if (images) {
      images.forEach((file) => {
        formData.append('images', file);
      });
    }
    
    return api.put(`/marketplace/items/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete item
  deleteItem: async (id: string) => {
    return api.delete(`/marketplace/items/${id}`);
  },

  // Send inquiry about item
  sendInquiry: async (id: string, message: string) => {
    return api.post(`/marketplace/items/${id}/inquiry`, { message });
  },

  // Get user's items
  getMyItems: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number;
  }) => {
    return api.get('/marketplace/my-items', { params });
  },

  // Get user's inquiries
  getMyInquiries: async (params?: { 
    type?: 'sent' | 'received'; 
    page?: number; 
    limit?: number;
  }) => {
    return api.get('/marketplace/my-inquiries', { params });
  },

  // Mark item as sold
  markAsSold: async (id: string) => {
    return api.put(`/marketplace/items/${id}/sold`);
  },
};

// Grievance API
export const grievanceApi = {
  // Get all grievance tickets
  getTickets: async (params?: { 
    status?: string; 
    priority?: string; 
    category?: string;
    page?: number; 
    limit?: number;
  }) => {
    return api.get('/grievance/tickets', { params });
  },

  // Create new grievance ticket
  createTicket: async (ticketData: {
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    relatedTo?: string;
  }, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('ticketData', JSON.stringify(ticketData));
    
    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }
    
    return api.post('/grievance/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get specific ticket
  getTicket: async (id: string) => {
    return api.get(`/grievance/tickets/${id}`);
  },

  // Update ticket
  updateTicket: async (id: string, updateData: any) => {
    return api.put(`/grievance/tickets/${id}`, updateData);
  },

  // Add comment to ticket
  addComment: async (id: string, comment: string, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('comment', comment);
    
    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }
    
    return api.post(`/grievance/tickets/${id}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get ticket comments
  getTicketComments: async (id: string) => {
    return api.get(`/grievance/tickets/${id}/comments`);
  },

  // Update ticket status (admin only)
  updateTicketStatus: async (id: string, status: string, resolution?: string) => {
    return api.put(`/grievance/tickets/${id}/status`, { status, resolution });
  },

  // Assign ticket (admin only)
  assignTicket: async (id: string, assignedTo: string) => {
    return api.put(`/grievance/tickets/${id}/assign`, { assignedTo });
  },
};

// Dashboard API
export const dashboardApi = {
  // Get dashboard overview
  getOverview: async () => {
    return api.get('/dashboard/overview');
  },

  // Get statistics
  getStatistics: async (params?: { 
    period?: 'day' | 'week' | 'month' | 'year';
    module?: string;
  }) => {
    return api.get('/dashboard/statistics', { params });
  },

  // Get recent activities
  getActivities: async (params?: { 
    limit?: number; 
    type?: string;
  }) => {
    return api.get('/dashboard/activities', { params });
  },

  // Get analytics data
  getAnalytics: async (params?: { 
    period?: string; 
    metrics?: string[];
  }) => {
    return api.get('/dashboard/analytics', { params });
  },

  // Get alerts for dashboard
  getAlerts: async () => {
    return api.get('/dashboard/alerts');
  },

  // Get notifications
  getNotifications: async (params?: { 
    page?: number; 
    limit?: number; 
    unread?: boolean;
  }) => {
    return api.get('/dashboard/notifications', { params });
  },

  // Mark notification as read
  markNotificationRead: async (id: string) => {
    return api.put(`/dashboard/notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    return api.put('/dashboard/notifications/read-all');
  },
};

export default api;
