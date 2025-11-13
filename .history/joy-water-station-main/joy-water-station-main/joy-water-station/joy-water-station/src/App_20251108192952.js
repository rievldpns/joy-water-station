import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Shield, LogOut, UserPlus, Edit2, Save, X, CheckCircle, AlertCircle, Users, Package, Warehouse, TrendingUp, Truck, Menu, Home, BarChart3, FileText, Settings, BookUser, UserX, UserCheck } from 'lucide-react';
import ItemManagement from './components/ItemManagement.js';
import InventoryManagement from './components/InventoryManagement.js';
import UserManagement from './components/UserManagement.js';
import CustomerManagement from './components/CustomerManagement.js';
import SalesManagement from './components/SalesManagement.js';
import DeliveryMonitoring from './components/DeliveryMonitoring.js';
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';

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
  // current view state
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? 'dashboard' : 'login';
  }); // login, register, dashboard, profile, password, users, items, inventory

  // sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // user authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // inventory and items state
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('inventoryProducts');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('inventoryItems');
    return saved ? JSON.parse(saved) : initialItems;
  });

  // customers state
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [];
  });

  // sales state
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : [];
  });

  // deliveries state
  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem('deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  // load data from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('inventoryProducts');
    const savedItems = localStorage.getItem('inventoryItems');
    const savedCustomers = localStorage.getItem('customers');
    const savedSales = localStorage.getItem('sales');
    const savedDeliveries = localStorage.getItem('deliveries');

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
    if (savedDeliveries) {
      setDeliveries(JSON.parse(savedDeliveries));
    }
  }, []);

  // save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('inventoryItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
  }, [deliveries]);

  // layout component for authenticated views
  const Layout = ({ title, children }) => (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentView={currentView} setCurrentView={setCurrentView} currentUser={currentUser} handleLogout={handleLogout} products={products} customers={customers} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentView={currentView} currentUser={currentUser} setCurrentView={setCurrentView} handleLogout={handleLogout} title={title} />
        {children}
      </div>
    </div>
  );

  // users database
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [
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
    ];
  });

  // form states
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

  // helper function to show messages
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // authentication functions
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Login failed');
        return;
      }

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setCurrentUser(data.user);
      setCurrentView('dashboard');
      setLoginForm({ username: '', password: '' });
      showMessage('success', 'Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  const handleRegister = async () => {
    // validation
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      showMessage('error', 'Please enter a valid email address');
      return;
    }

    // Validate Philippine phone number format (starts with 09, exactly 11 digits)
    const phoneRegex = /^09\d{9}$/;
    if (registerForm.phone && !phoneRegex.test(registerForm.phone)) {
      showMessage('error', 'Phone number must be in Philippine format (starts with 09, exactly 11 digits)');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          phone: registerForm.phone,
          address: registerForm.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Registration failed');
        return;
      }

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      setCurrentUser(data.user);
      setCurrentView('dashboard');
      setRegisterForm({
        username: '', email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', phone: '', address: ''
      });
      showMessage('success', 'Account created successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setCurrentView('login');
    showMessage('success', 'Logged out successfully!');
  };

  // profile management
  const handleEditProfile = () => {
    setProfileForm({...currentUser});
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Failed to update profile');
        return;
      }

      setCurrentUser({...profileForm});
      localStorage.setItem('currentUser', JSON.stringify({...profileForm}));
      setIsEditing(false);
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({});
    setIsEditing(false);
  };

  // password management
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showMessage('error', 'Please fill in all fields');
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

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Failed to change password');
        return;
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  // user management functions
  const handleBlockUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Failed to block user');
        return;
      }

      const updatedUsers = users.map(user =>
        user.id === userId ? {...user, isBlocked: true} : user
      );
      setUsers(updatedUsers);
      showMessage('success', 'User blocked successfully!');
    } catch (error) {
      console.error('Block user error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  // toggle password visibility
  const togglePassword = (field) => {
    setShowPassword(prev => ({...prev, [field]: !prev[field]}));
  };

  const handleUnblockUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/unblock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage('error', data.message || 'Failed to unblock user');
        return;
      }

      const updatedUsers = users.map(user =>
        user.id === userId ? {...user, isBlocked: false} : user
      );
      setUsers(updatedUsers);
      showMessage('success', 'User unblocked successfully!');
    } catch (error) {
      console.error('Unblock user error:', error);
      showMessage('error', 'Network error. Please try again.');
    }
  };

  // message component
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

  // login View
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

  // register View
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

// dashboard view
if (currentView === 'dashboard') {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                <span className="text-white font-bold text-lg">💧</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Joy Water Station</h2>
                <p className="text-xs text-blue-100">Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5 mr-3" />
              <span className="font-medium">Dashboard</span>
            </button>

            {currentUser?.role === 'Administrator' && (
              <button
                onClick={() => setCurrentView('users')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                  currentView === 'users'
                    ? 'bg-indigo-100 text-indigo-700 border-r-4 border-indigo-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">User Management</span>
              </button>
            )}

            <button
              onClick={() => setCurrentView('customers')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === 'customers'
                  ? 'bg-green-100 text-green-700 border-r-4 border-green-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookUser className="w-5 h-5 mr-3" />
              <span className="font-medium">Customer Management</span>
            </button>

            <button
              onClick={() => setCurrentView('items')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === 'items'
                  ? 'bg-green-100 text-green-700 border-r-4 border-green-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-5 h-5 mr-3" />
              <span className="font-medium">Item Management</span>
            </button>

            <button
              onClick={() => setCurrentView('inventory')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === 'inventory'
                  ? 'bg-yellow-100 text-yellow-700 border-r-4 border-yellow-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Warehouse className="w-5 h-5 mr-3" />
              <span className="font-medium">Inventory</span>
            </button>

            <button
              onClick={() => setCurrentView('sales')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === 'sales'
                  ? 'bg-red-100 text-red-700 border-r-4 border-red-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              <span className="font-medium">Sales</span>
            </button>

            <button
              onClick={() => setCurrentView('delivery-monitoring')}
              className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span className="font-medium">Delivery Monitoring</span>
            </button>
          </nav>

          {/* sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.firstName || currentUser?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden mr-4 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="hidden lg:flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📊</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, {currentUser?.firstName || currentUser?.username}!</p>
                  </div>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
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

        {/* main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Message />

          {/* welcome section */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.firstName || currentUser?.username}!</h2>
            <p className="text-blue-100">Here's what's happening with your water station today.</p>
          </div>

          {/* statistics overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{items.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sales Today</p>
                  <p className="text-2xl font-semibold text-gray-900">$0.00</p>
                  <p className="text-xs text-gray-500"></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                  <p className="text-xs text-gray-500"></p>
                </div>
              </div>
            </div>
          </div>

          {/* system modules */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group" onClick={() => setCurrentView('users')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 text-sm mb-3">Manage system users, roles, and permissions</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">User Roles</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Permissions</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Analytics</span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-green-300 transition-all duration-200 group" onClick={() => setCurrentView('items')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Item Management</h3>
                <p className="text-gray-600 text-sm mb-3">Add, edit, and manage inventory items</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Item Catalog</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Performance</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Analytics</span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-yellow-300 transition-all duration-200 group" onClick={() => setCurrentView('inventory')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200 transition-colors">
                    <Warehouse className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Inventory Management</h3>
                <p className="text-gray-600 text-sm mb-3">Track stock levels and inventory status</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Stock Levels</span>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Movements</span>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Delivery Monitoring</span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-200 group" onClick={() => setCurrentView('sales')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-full group-hover:bg-purple-200 transition-colors">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sales Management</h3>
                <p className="text-gray-600 text-sm mb-3">Monitor sales performance and analytics</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Performance</span>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Analytics</span>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Trends</span>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-red-300 transition-all duration-200 group relative" onClick={() => setCurrentView('delivery-monitoring')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-full group-hover:bg-red-200 transition-colors">
                    <Truck className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">!</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Monitoring</h3>
                <p className="text-gray-600 text-sm mb-3">Track delivery status and logistics</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Tracking</span>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Logistics</span>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Status Updates</span>
                </div>
              </div>
            </div>
          </div>


        </main>
      </div>
    </div>
  );
}

  // item management view
  if (currentView === 'items') {
    return (
      <Layout title="Item Management">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ItemManagement items={items} setItems={setItems} setCurrentView={setCurrentView} />
        </main>
      </Layout>
    );
  }

// profile management view
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* header */}
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

// password management view
  if (currentView === 'password') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* header */}
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

// user management view
if (currentView === 'users') {
  return (
    <Layout title="User Management">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement
          users={users}
          setUsers={setUsers}
          currentUser={currentUser}
          setCurrentView={setCurrentView}
        />
      </main>
    </Layout>
  );
}

// inventory management view
if (currentView === 'inventory') {
  return (
    <Layout title="Inventory Management">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InventoryManagement products={products} setProducts={setProducts} setCurrentView={setCurrentView} />
      </main>
    </Layout>
  );
}

// customer management view
if (currentView === 'customers') {
  return (
    <Layout title="Customer Management">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerManagement customers={customers} setCustomers={setCustomers} />
      </main>
    </Layout>
  );
}

// sales management view
if (currentView === 'sales') {
  return (
    <Layout title="Sales Management">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SalesManagement
          sales={sales}
          setSales={setSales}
          customers={customers}
          items={items}
          setItems={setItems}
          products={products}
          setProducts={setProducts}
          deliveries={deliveries}
          setDeliveries={setDeliveries}
        />
      </main>
    </Layout>
  );
}

// delivery monitoring view
if (currentView === 'delivery-monitoring') {
  return (
    <Layout title="Delivery Monitoring">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DeliveryMonitoring sales={sales} customers={customers} items={items} />
      </main>
    </Layout>
  );
}
}