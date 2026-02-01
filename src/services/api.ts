/**
 * API Service
 * Client wrapper for all backend endpoints
 * Handles requests with JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Get JWT token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Generic API request handler
 */
const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available and not skipped
  const token = getAuthToken();
  if (token && !skipAuth) {
    console.log('📤 Sending token with request:', token.substring(0, 20) + '...');
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge fetch options headers
  if (fetchOptions.headers) {
    const additionalHeaders = fetchOptions.headers as Record<string, string>;
    Object.assign(headers, additionalHeaders);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `API error: ${response.status}`);
    }

    return data as T;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

/**
 * ===========================
 * AUTHENTICATION ENDPOINTS
 * ===========================
 */

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (email: string, password: string, name: string, phone?: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password, name, phone }),
    });
  },

  /**
   * Login user
   */
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiRequest('/auth/profile', {
      method: 'GET',
    });
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: { name?: string; phone?: string; photo?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Logout user
   */
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

/**
 * ===========================
 * ITEMS ENDPOINTS
 * ===========================
 */

export const itemsAPI = {
  /**
   * Report a lost item
   */
  reportLost: async (itemData: {
    itemName: string;
    category: string;
    description: string;
    location: string;
    lostDate: string;
    lostTime: string;
    color?: string;
    brand?: string;
    estimatedValue?: number;
    imageUrl?: string;
  }) => {
    return apiRequest('/items/report-lost', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Report a found item
   */
  reportFound: async (itemData: {
    itemName: string;
    category: string;
    description: string;
    foundLocation: string;
    foundDate: string;
    foundTime: string;
    currentLocation?: string;
    color?: string;
    brand?: string;
    imageUrl?: string;
  }) => {
    return apiRequest('/items/report-found', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Get user's items
   */
  getUserItems: async (type?: 'lost' | 'found') => {
    const url = type ? `/items/my-items?type=${type}` : '/items/my-items';
    return apiRequest(url, { method: 'GET' });
  },

  /**
   * Search items
   */
  searchItems: async (query?: string, category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const url = `/items/search${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest(url, { method: 'GET' });
  },

  /**
   * Get single item
   */
  getItem: async (itemId: string) => {
    return apiRequest(`/items/${itemId}`, { method: 'GET' });
  },

  /**
   * Update item
   */
  updateItem: async (itemId: string, updates: any) => {
    return apiRequest(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete item
   */
  deleteItem: async (itemId: string) => {
    return apiRequest(`/items/${itemId}`, { method: 'DELETE' });
  },

  /**
   * Get items by category
   */
  getByCategory: async (category: string) => {
    return apiRequest(`/items/category/${category}`, { method: 'GET' });
  },
};

/**
 * ===========================
 * MATCHING ENDPOINTS
 * ===========================
 */

export const matchesAPI = {
  /**
   * Get all matches in system
   */
  getAllMatches: async () => {
    return apiRequest('/matches/find', { method: 'GET', skipAuth: true });
  },

  /**
   * Get matches for specific lost item
   */
  getItemMatches: async (itemId: string) => {
    return apiRequest(`/matches/item/${itemId}`, { method: 'GET', skipAuth: true });
  },

  /**
   * Get user's lost items with matches
   */
  getUserMatches: async () => {
    return apiRequest('/matches/user-matches', { method: 'GET' });
  },

  /**
   * Request a claim for matched items
   */
  requestClaim: async (lostItemId: string, foundItemId: string) => {
    return apiRequest('/matches/request-claim', {
      method: 'POST',
      body: JSON.stringify({ lostItemId, foundItemId }),
    });
  },

  /**
   * Get claim details
   */
  getClaim: async (claimId: string) => {
    return apiRequest(`/matches/claims/${claimId}`, { method: 'GET' });
  },
};

/**
 * ===========================
 * HANDOVER ENDPOINTS
 * ===========================
 */

export const handoversAPI = {
  /**
   * Verify ownership with verification answers
   */
  verifyOwner: async (claimId: string, answers: string[]) => {
    return apiRequest('/handovers/verify-owner', {
      method: 'POST',
      body: JSON.stringify({ claimId, answers }),
    });
  },

  /**
   * Generate OTP and QR code
   */
  generateOTP: async (claimId: string, location: string) => {
    return apiRequest('/handovers/generate-otp', {
      method: 'POST',
      body: JSON.stringify({ claimId, location }),
    });
  },

  /**
   * Confirm handover with OTP
   */
  confirmHandover: async (handoverId: string, otp: string) => {
    return apiRequest('/handovers/confirm-handover', {
      method: 'POST',
      body: JSON.stringify({ handoverId, otp }),
    });
  },

  /**
   * Get handover details
   */
  getHandover: async (handoverId: string) => {
    return apiRequest(`/handovers/${handoverId}`, { method: 'GET' });
  },
};

/**
 * ===========================
 * ADMIN ENDPOINTS
 * ===========================
 */

export const adminAPI = {
  /**
   * Get admin dashboard data
   */
  getDashboardData: async () => {
    return apiRequest('/admin/dashboard-data', { method: 'GET' });
  },

  /**
   * Get all users
   */
  getUsers: async (filter?: { role?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filter?.role) params.append('role', filter.role);
    if (filter?.status) params.append('status', filter.status);

    const url = `/admin/users${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest(url, { method: 'GET' });
  },

  /**
   * Get all claims
   */
  getClaims: async (status?: string) => {
    const url = status ? `/admin/claims?status=${status}` : '/admin/claims';
    return apiRequest(url, { method: 'GET' });
  },

  /**
   * Approve a claim
   */
  approveClaim: async (claimId: string, notes?: string) => {
    return apiRequest(`/admin/claim/${claimId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  /**
   * Reject a claim
   */
  rejectClaim: async (claimId: string, reason: string) => {
    return apiRequest(`/admin/claim/${claimId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Get all handovers
   */
  getHandovers: async () => {
    return apiRequest('/admin/handovers', { method: 'GET' });
  },

  /**
   * Disable user account
   */
  disableUser: async (userId: string, reason?: string) => {
    return apiRequest(`/admin/user/${userId}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Enable user account
   */
  enableUser: async (userId: string) => {
    return apiRequest(`/admin/user/${userId}/enable`, {
      method: 'POST',
    });
  },

  /**
   * Get location heatmap data
   */
  getHeatmapData: async () => {
    return apiRequest('/admin/stats/heatmap', { method: 'GET' });
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (limit?: number) => {
    const url = limit ? `/admin/audit-log?limit=${limit}` : '/admin/audit-log';
    return apiRequest(url, { method: 'GET' });
  },
};

/**
 * Export API client
 */
export default {
  auth: authAPI,
  items: itemsAPI,
  matches: matchesAPI,
  handovers: handoversAPI,
  admin: adminAPI,
};
