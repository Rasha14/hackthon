// API Service for Lost&Found AI+ Frontend
// Handles all communication with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message);
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message);
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!getAuthToken(),
};

// Items API
export const itemsAPI = {
  reportLost: async (itemData: {
    name: string;
    category: string;
    description: string;
    location: string;
    time: string;
    verification_answers: string[];
    image?: File;
  }) => {
    const formData = new FormData();
    formData.append('name', itemData.name);
    formData.append('category', itemData.category);
    formData.append('description', itemData.description);
    formData.append('location', itemData.location);
    formData.append('time', itemData.time);
    formData.append('verification_answers', JSON.stringify(itemData.verification_answers));

    if (itemData.image) {
      formData.append('image', itemData.image);
    }

    return makeAuthenticatedRequest('/items/report-lost', {
      method: 'POST',
      body: formData,
    });
  },

  reportFound: async (itemData: {
    name: string;
    category: string;
    description: string;
    location: string;
    time: string;
    image?: File;
  }) => {
    const formData = new FormData();
    formData.append('name', itemData.name);
    formData.append('category', itemData.category);
    formData.append('description', itemData.description);
    formData.append('location', itemData.location);
    formData.append('time', itemData.time);

    if (itemData.image) {
      formData.append('image', itemData.image);
    }

    return makeAuthenticatedRequest('/items/report-found', {
      method: 'POST',
      body: formData,
    });
  },

  getMyLostItems: () => makeAuthenticatedRequest('/items/my-lost-items'),

  getMyFoundItems: () => makeAuthenticatedRequest('/items/my-found-items'),

  generateVerificationQuestions: async (category: string) => {
    // For now, return hardcoded questions based on category
    // In production, this would call the backend AI service
    const questions = {
      phone: [
        { question: "What color is the phone case?", type: "text", options: ["Black", "White", "Blue", "Red", "Other"] },
        { question: "Does it have any distinctive scratches or marks?", type: "boolean", options: ["Yes", "No"] },
        { question: "What brand is the phone?", type: "text", options: ["iPhone", "Samsung", "Google", "OnePlus", "Other"] }
      ],
      wallet: [
        { question: "How many card slots does it have?", type: "number", options: ["2-4", "5-8", "9-12", "More than 12"] },
        { question: "What color is the wallet?", type: "text", options: ["Black", "Brown", "Blue", "Red", "Other"] },
        { question: "Does it have a coin pocket?", type: "boolean", options: ["Yes", "No"] }
      ],
      keys: [
        { question: "How many keys are on the keyring?", type: "number", options: ["1-3", "4-6", "7-10", "More than 10"] },
        { question: "What type of keyring does it have?", type: "text", options: ["Metal", "Plastic", "Leather", "Other"] },
        { question: "Are there any distinctive keychains?", type: "boolean", options: ["Yes", "No"] }
      ],
      bag: [
        { question: "What color is the zipper?", type: "text", options: ["Black", "Silver", "Gold", "Colored"] },
        { question: "How many compartments does it have?", type: "number", options: ["1", "2", "3", "4+"] },
        { question: "What brand or logo is on the bag?", type: "text", options: ["Nike", "Adidas", "No brand", "Other"] }
      ],
      default: [
        { question: "What is the primary color of the item?", type: "text", options: ["Black", "White", "Blue", "Red", "Other"] },
        { question: "Are there any distinctive marks or labels?", type: "boolean", options: ["Yes", "No"] },
        { question: "What is the approximate size?", type: "text", options: ["Small", "Medium", "Large", "Extra Large"] }
      ]
    };

    return { questions: questions[category.toLowerCase()] || questions.default };
  },
};

// Matches API
export const matchesAPI = {
  getMatches: (lostItemId: string) =>
    makeAuthenticatedRequest(`/matches/match-items?lostItemId=${lostItemId}`),

  getItemMatches: (lostItemId: string) =>
    makeAuthenticatedRequest(`/matches/item-matches/${lostItemId}`),

  getMyMatches: () => makeAuthenticatedRequest('/matches/my-matches'),
};

// Handovers API
export const handoversAPI = {
  verifyOwner: (verificationData: {
    matchId: string;
    answers: string[];
  }) => makeAuthenticatedRequest('/handovers/verify-owner', {
    method: 'POST',
    body: JSON.stringify(verificationData),
  }),

  generateOTP: (handoverId: string) => makeAuthenticatedRequest('/handovers/generate-otp', {
    method: 'POST',
    body: JSON.stringify({ handoverId }),
  }),

  confirmHandover: (handoverData: {
    handoverId: string;
    otp: string;
  }) => makeAuthenticatedRequest('/handovers/confirm-handover', {
    method: 'POST',
    body: JSON.stringify(handoverData),
  }),

  getHandoverDetails: (handoverId: string) =>
    makeAuthenticatedRequest(`/handovers/${handoverId}`),
};

// Admin API
export const adminAPI = {
  getDashboardData: () => makeAuthenticatedRequest('/admin/dashboard-data'),

  approveHandover: (handoverId: string, otp?: string) =>
    makeAuthenticatedRequest('/admin/approve-handover', {
      method: 'POST',
      body: JSON.stringify({ handoverId, otp }),
    }),

  rejectHandover: (handoverId: string, reason?: string) =>
    makeAuthenticatedRequest('/admin/reject-handover', {
      method: 'POST',
      body: JSON.stringify({ handoverId, reason }),
    }),

  getHandovers: () => makeAuthenticatedRequest('/admin/handovers'),
};

// Health check
export const healthAPI = {
  check: () => fetch(`${API_BASE_URL}/health`).then(res => res.json()),
};

export default {
  auth: authAPI,
  items: itemsAPI,
  matches: matchesAPI,
  handovers: handoversAPI,
  admin: adminAPI,
  health: healthAPI,
};
