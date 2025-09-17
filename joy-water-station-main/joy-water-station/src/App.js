import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, Settings, Shield, LogOut, UserPlus, Edit2, Save, X, CheckCircle, AlertCircle, UserCheck, UserX, Users, Package, Warehouse, TrendingUp, Truck } from 'lucide-react';
import ItemManagement from './components/ItemManagement';
import InventoryManagement from './components/InventoryManagement';

const initialProducts = [
  {
    id: 1,
    name: 'Full Water Gallon',
    category: 'Water Products',
    cost: 20.0,
    price: 25.0,
    uom: 'Gallon',
    currentStock: 45,
    minStock: 10,
    maxStock: 100,
    description: '5-gallon container filled with purified drinking water',
  },
  {
    id: 2,
    name: 'Refilled Water Gallon',
    category: 'Water Products',
    cost: 12.0,
    price: 15.0,
    uom: 'Gallon',
    currentStock: 8,
    minStock: 15,
    maxStock: 80,
    description: '5-gallon container refilled with purified drinking water',
  },
  {
    id: 3,
    name: 'Empty Water Gallon',
    category: 'Containers',
    cost: 3.0,
    price: 5.0,
    uom: 'Gallon',
    currentStock: 25,
    minStock: 5,
    maxStock: 50,
    description: 'Empty 5-gallon reusable water container',
  },
  {
    id: 4,
    name: 'Stickers',
    category: 'Accessories',
    cost: 1.0,
    price: 2.0,
    uom: 'Pack',
    currentStock: 120,
    minStock: 20,
    maxStock: 200,
    description: 'Decorative stickers for water bottles (pack of 10)',
  },
  {
    id: 5,
    name: 'Lids',
    category: 'Accessories',
    cost: 1.5,
    price: 3.0,
    uom: 'Piece',
    currentStock: 2,
    minStock: 10,
    maxStock: 100,
    description: 'Replacement lids for 5-gallon water containers',
  },
];

const initialItems = [
  {
    id: 1,
    name: 'Full Water Gallon',
    category: 'Water Products',
    price: 25.0,
    uom: 'Gallon',
    description: '5-gallon container filled with purified drinking water',
  },
  {
    id: 2,
    name: 'Refilled Water Gallon',
    category: 'Water Products',
    price: 15.0,
    uom: 'Gallon',
    description: '5-gallon container refilled with purified drinking water',
  },
  {
    id: 3,
    name: 'Empty Water Gallon',
    category: 'Containers',
    price: 5.0,
    uom: 'Gallon',
    description: 'Empty 5-gallon reusable water container',
  },
  {
    id: 4,
    name: 'Stickers',
    category: 'Accessories',
    price: 2.0,
    uom: 'Pack',
    description: 'Decorative stickers for water bottles (pack of 10)',
  },
  {
    id: 5,
    name: 'Lids',
    category: 'Accessories',
    price: 3.0,
    uom: 'Piece',
    description: 'Replacement lids for 5-gallon water containers',
  },
];

export default function UserManagementSystem() {
  // Current view state
  const [currentView, setCurrentView] = useState('login'); // login, register, dashboard, profile, password, users, items, inventory

  // Test Tailwind style application
  console.log('Tailwind test: bg-blue-500 class should apply to this div');

  // Wrap root div with Tailwind class for testing

  // User authentication state
  const [currentUser, setCurrentUser] = useState(null);

  // Inventory and items state
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('inventoryProducts');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('inventoryItems');
    return saved ? JSON.parse(saved) : initialItems;
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('inventoryProducts');
    const savedItems = localStorage.getItem('inventoryItems');

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('inventoryItems', JSON.stringify(items));
  }, [items]);

  // Users database (in real app, this would be in backend)
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'admin',
      email: 'admin@joywater.com',
      password: 'admin123',
      firstName: 'Sarah',
      lastName: 'Admin',
      phone: '09123456789',
      address: 'Davao City',
      role: 'Administrator',
      createdAt: '2024-01-15',
      lastLogin: '2024-08-27',
      isBlocked: false
    }
  ]);

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', address: ''
  });
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmNewPassword: ''
  });

  // UI states
  const [showPassword, setShowPassword] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Helper function to show messages
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Authentication functions
  const handleLogin = () => {
    const user = users.find(u => 
      (u.username === loginForm.username || u.email === loginForm.username) && 
      u.password === loginForm.password
    );
    
    if (!user) {
      showMessage('error', 'Invalid username/email or password');
      return;
    }

    if (user.isBlocked) {
      showMessage('error', 'Your account has been blocked. Please contact administrator.');
      return;
    }
    
    setCurrentUser({...user, lastLogin: new Date().toISOString().split('T')[0]});
    setCurrentView('dashboard');
    setLoginForm({ username: '', password: '' });
    showMessage('success', 'Login successful!');
  };

  const handleRegister = () => {
    // Validation
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (users.find(u => u.username === registerForm.username)) {
      showMessage('error', 'Username already exists');
      return;
    }

    if (users.find(u => u.email === registerForm.email)) {
      showMessage('error', 'Email already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: users.length + 1,
      ...registerForm,
      role: 'User',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0],
      isBlocked: false
    };
    
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCurrentView('dashboard');
    setRegisterForm({
      username: '', email: '', password: '', confirmPassword: '',
      firstName: '', lastName: '', phone: '', address: ''
    });
    showMessage('success', 'Account created successfully!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    showMessage('success', 'Logged out successfully!');
  };

  // Profile management
  const handleEditProfile = () => {
    setProfileForm({...currentUser});
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? {...profileForm} : user
    );
    setUsers(updatedUsers);
    setCurrentUser({...profileForm});
    setIsEditing(false);
    showMessage('success', 'Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setProfileForm({});
    setIsEditing(false);
  };

  // Password management
  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showMessage('error', 'Please fill in all fields');
      return;
    }

    if (currentUser.password !== passwordForm.currentPassword) {
      showMessage('error', 'Current password is incorrect');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    // Update password
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? {...user, password: passwordForm.newPassword} : user
    );
    setUsers(updatedUsers);
    setCurrentUser({...currentUser, password: passwordForm.newPassword});
    setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    showMessage('success', 'Password changed successfully!');
  };

  // User management functions
  const handleBlockUser = (userId) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? {...user, isBlocked: true} : user
    );
    setUsers(updatedUsers);
    showMessage('success', 'User blocked successfully!');
  };

  const handleUnblockUser = (userId) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? {...user, isBlocked: false} : user
    );
    setUsers(updatedUsers);
    showMessage('success', 'User unblocked successfully!');
  };

  const handleChangeRole = (userId, newRole) => {
    if (userId === currentUser.id) {
      showMessage('error', 'You cannot change your own role');
      return;
    }

    const updatedUsers = users.map(user =>
      user.id === userId ? {...user, role: newRole} : user
    );
    setUsers(updatedUsers);
    showMessage('success', 'User role updated successfully!');
  };

  // Toggle password visibility
  const togglePassword = (field) => {
    setShowPassword(prev => ({...prev, [field]: !prev[field]}));
  };

  // Message component
  const Message = () => {
    if (!message.text) return null;
    
    return (
      <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {message.text}
      </div>
    );
  };

  // Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-blue-500">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="bg-blue-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <Message />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword.login ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('login')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.login ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Sign In
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  Create Account
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Register View
  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="bg-green-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join our system today</p>
          </div>

          <Message />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Choose username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={registerForm.address}
                onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword.register ? "text" : "password"}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Create password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePassword('register')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword.register ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePassword('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleRegister}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Create Account
            </button>
            <button
              onClick={() => setCurrentView('login')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">User Management System</h1>
                  <p className="text-sm text-gray-500">Welcome back, {currentUser?.firstName || currentUser?.username}!</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('profile')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Message />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.filter(u => !u.isBlocked).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.role === 'Administrator').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users.filter(u => u.createdAt === new Date().toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setCurrentView('profile')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3 transition-colors duration-200"
              >
                <User className="w-5 h-5" />
                <span>Manage Profile</span>
              </button>
              <button
                onClick={() => setCurrentView('password')}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center gap-3 transition-colors duration-200"
              >
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </button>
              {currentUser?.role === 'Administrator' && (
                <button
                  onClick={() => setCurrentView('users')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg flex items-center gap-3 transition-colors duration-200"
                >
                  <Users className="w-5 h-5" />
                  <span>Manage Users</span>
                </button>
              )}
              <button
                onClick={() => setCurrentView('register')}
                className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg flex items-center gap-3 transition-colors duration-200"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add New User</span>
              </button>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Username</p>
                <p className="text-lg text-gray-900">{currentUser?.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg text-gray-900">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-lg text-gray-900">{currentUser?.firstName} {currentUser?.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg text-gray-900">{currentUser?.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg text-gray-900">{currentUser?.createdAt}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-lg text-gray-900">{currentUser?.lastLogin}</p>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <h2 className="mt-8 mb-4 text-gray-800">System Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('User Management module')}>
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 text-sm">Manage system users, roles, and permissions</p>
            </div>

            <div className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('items')}>
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Item Management</h3>
              <p className="text-gray-600 text-sm">Add, edit, and manage inventory items</p>
            </div>

            <div className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('inventory')}>
              <div className="bg-yellow-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                <Warehouse className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Inventory Management</h3>
              <p className="text-gray-600 text-sm">Track stock levels and inventory status</p>
            </div>

            <div className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Sales Management module')}>
              <div className="bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sales Management</h3>
              <p className="text-gray-600 text-sm">Monitor sales performance and analytics</p>
            </div>

            <div className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Delivery Monitoring module')}>
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                <Truck className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Monitoring</h3>
              <p className="text-gray-600 text-sm">Track delivery status and logistics</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // User Management View
  if (currentView === 'items') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Item Management</h1>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ItemManagement />
        </main>
      </div>
    );
  }

  // Profile Management View
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Profile Management</h1>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Message />
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={handleEditProfile}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.firstName || ''}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.firstName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.lastName || ''}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.lastName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.username || ''}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.address || ''}
                    onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{currentUser?.address || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <p className="text-lg text-gray-900">{currentUser?.role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <p className="text-lg text-gray-900">{currentUser?.createdAt}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <button
                onClick={() => setCurrentView('password')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Password Management View
  if (currentView === 'password') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Password Management</h1>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Message />

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-gray-600">Keep your account secure with a strong password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword.confirmNew ? "text" : "password"}
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('confirmNew')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword.confirmNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Mix of letters and numbers recommended</li>
                <li>• Avoid using personal information</li>
                <li>• Different from your current password</li>
              </ul>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                  setCurrentView('dashboard');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>


          </div>
        </main>
      </div>
    );
  }

  return null;
}
