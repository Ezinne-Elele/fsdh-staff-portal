// Using mock authentication - no backend API calls

// Mock staff users for demo
const MOCK_STAFF_USERS = [
  {
    userId: 'STAFF-001',
    email: 'admin@fsdh.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    permissions: ['approve_instructions', 'approve_account_closures', 'manage_users', 'view_all', 'manage_settings'],
    requiresMFA: false,
  },
  {
    userId: 'STAFF-002',
    email: 'maker@fsdh.com',
    password: 'Maker123!',
    firstName: 'Trade',
    lastName: 'Maker',
    role: 'maker',
    permissions: ['create_trades', 'view_trades'],
    requiresMFA: false,
  },
  {
    userId: 'STAFF-003',
    email: 'checker@fsdh.com',
    password: 'Checker123!',
    firstName: 'Trade',
    lastName: 'Checker',
    role: 'checker',
    permissions: ['approve_instructions', 'view_all'],
    requiresMFA: false,
  },
  {
    userId: 'STAFF-004',
    email: 'viewer@fsdh.com',
    password: 'viewer123',
    firstName: 'Viewer',
    lastName: 'User',
    role: 'viewer',
    permissions: [],
    requiresMFA: false,
  },
  {
    userId: 'USER-EZINNE',
    email: 'ezinne.elele@fsdh.com',
    password: 'Ezinne123!',
    firstName: 'Ezinne',
    lastName: 'Elele',
    role: 'checker',
    permissions: ['approve_instructions', 'view_all'],
    requiresMFA: false,
  },
  {
    userId: 'USER-ALIU',
    email: 'aliu.muibi@fsdh.com',
    password: 'Aliu123!',
    firstName: 'Aliu',
    lastName: 'Muibi',
    role: 'maker',
    permissions: ['create_trades', 'view_trades'],
    requiresMFA: false,
  },
];

export const authService = {
  async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find user
    const user = MOCK_STAFF_USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Generate mock token
    const token = `mock_token_${user.userId}_${Date.now()}`;
    const userData = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions || [],
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return {
      token,
      user: userData,
      requiresMFA: user.requiresMFA,
    };
  },

  async verifyMFA(userId, token) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock MFA verification - accept any 6-digit code
    if (token && token.length === 6) {
      const user = MOCK_STAFF_USERS.find(u => u.userId === userId);
      if (user) {
        const authToken = `mock_token_${userId}_${Date.now()}`;
        const userData = {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions || [],
        };
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return {
          token: authToken,
          user: userData,
        };
      }
    }
    throw new Error('Invalid MFA token');
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },
};

