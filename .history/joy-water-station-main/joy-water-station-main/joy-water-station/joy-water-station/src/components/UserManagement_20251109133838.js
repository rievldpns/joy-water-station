import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit2, Save, X, UserX, UserCheck, Trash2, Search, ChevronDown, ChevronUp, Key, RefreshCw } from 'lucide-react';

const roles = ['All', 'User', 'Administrator'];

function UserManagement({ users, setUsers, currentUser, setCurrentView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingUserId, setEditingUserId] = useState(null);
  const [changingPasswordUserId, setChangingPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    role: 'User',
  });

  const hasFetchedRef = useRef(false);
  const isUnmountedRef = useRef(false);

  // Memoize fetchUsers to prevent recreation on every render
  const fetchUsers = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      // Check if user is admin - only admins can view all users
      if (currentUser?.role !== 'Administrator') {
        // Non-admin users only see themselves
        if (!isUnmountedRef.current) {
          setUsers(currentUser ? [currentUser] : []);
          setError(null);
          setLoading(false);
        }
        return;
      }

      // Fetch all users (including those who haven't logged in) - Admin only
      const response = await fetch('http://localhost:5000/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await fetch('http://localhost:5000/api/users/refresh-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('token', refreshData.token);

                // Retry the fetch with new token
                const newToken = refreshData.token;
                const retryResponse = await fetch('http://localhost:5000/api/users/all', {
                  headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  if (!isUnmountedRef.current) {
                    setUsers(data);
                    setError(null);
                  }
                } else {
                  if (!isUnmountedRef.current) {
                    setError('Failed to fetch users after token refresh');
                  }
                }
              } else {
                if (!isUnmountedRef.current) {
                  setError('Session expired. Please login again.');
                }
              }
            } catch (refreshError) {
              console.error('Refresh token error:', refreshError);
              if (!isUnmountedRef.current) {
                setError('Session expired. Please login again.');
              }
            }
          } else {
            if (!isUnmountedRef.current) {
              setError('Session expired. Please login again.');
            }
          }
        } else {
          const errorData = await response.json();
          if (!isUnmountedRef.current) {
            setError(errorData.message || 'Failed to fetch users');
          }
          console.error('Fetch users error:', errorData);
        }
      } else {
        const data = await response.json();
        console.log('Fetched users:', data);
        if (!isUnmountedRef.current) {
          setUsers(data);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Network error fetching users:', error);
      if (!isUnmountedRef.current) {
        setError('Network error. Please check your connection.');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [setUsers, currentUser]);

  // Fetch users on component mount - Only once
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUsers();
    }

    // Cleanup function
    return () => {
      isUnmountedRef.current = true;
    };
  }, [fetchUsers]);

  // Memoize filtered and sorted users to prevent unnecessary recalculations
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = filterRole === 'All' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (!sortField) return 0;
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Memoize summary statistics
  const stats = React.useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.isBlocked).length,
    blockedUsers: users.filter(user => user.isBlocked).length,
    administrators: users.filter(u => u.role === 'Administrator').length
  }), [users]);

  // Handlers
  const handleSort = useCallback((field) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        return field;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  const startEdit = useCallback((user) => {
    // Users can only edit their own information
    if (user.id !== currentUser.id) {
      alert('You can only edit your own information');
      return;
    }
    setEditingUserId(user.id);
    setFormData({ ...user });
  }, [currentUser]);

  const cancelEdit = useCallback(() => {
    setEditingUserId(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      role: 'User',
    });
  }, []);

  const startChangePassword = useCallback((user) => {
    // Users can only change their own password
    if (user.id !== currentUser.id) {
      alert('You can only change your own password');
      return;
    }
    setChangingPasswordUserId(user.id);
    setNewPassword('');
  }, [currentUser]);

  const cancelChangePassword = useCallback(() => {
    setChangingPasswordUserId(null);
    setNewPassword('');
  }, []);

  const saveChangePassword = async () => {
    // Validate password strength
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: '', newPassword })
      });

      if (response.ok) {
        alert('Password changed successfully');
        cancelChangePassword();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      alert('Network error. Please try again.');
    }
  };

  const saveEdit = async () => {
    // Validate required fields
    if (!formData.username || !formData.email) {
      alert('Please fill in required fields: Username, Email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate Philippine phone number format (starts with 09, exactly 11 digits)
    const phoneRegex = /^09\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      alert('Phone number must be in Philippine format (starts with 09, exactly 11 digits)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('User updated successfully');
        await fetchUsers(); // Refresh users list
        cancelEdit();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      alert('Network error. Please try again.');
    }
  };

  const hideUser = async (id) => {
    const user = users.find(u => u.id === id);
    if (user && user.role === 'Administrator') {
      alert('Cannot hide administrator accounts');
      return;
    }

    if (window.confirm('Are you sure you want to hide this user? This action will remove them from the user list.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/${id}/hide`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          alert('User hidden successfully');
          await fetchUsers(); // Refresh users list
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to hide user');
        }
      } catch (error) {
        console.error('Hide user error:', error);
        alert('Network error. Please try again.');
      }
    }
  };

  const toggleBlock = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    if (user.role === 'Administrator') {
      alert('Cannot block administrator accounts');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const action = user.isBlocked ? 'unblock' : 'block';
      const response = await fetch(`http://localhost:5000/api/users/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert(`User ${action}ed successfully`);
        await fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Toggle block error:`, error);
      alert('Network error. Please try again.');
    }
  };

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Info message for non-admin users */}
      {currentUser?.role !== 'Administrator' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <strong>Note:</strong> You are viewing your own account information. Only administrators can view all users.
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Loading users...
        </div>
      )}

      {/* Summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-xl font-bold">{stats.activeUsers}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Blocked Users</p>
          <p className="text-xl font-bold">{stats.blockedUsers}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Administrators</p>
          <p className="text-xl font-bold">{stats.administrators}</p>
        </div>
      </div>

      {/* Your account information */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Username</p>
              <p className="text-lg text-gray-900">{currentUser.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-lg text-gray-900">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Full Name</p>
              <p className="text-lg text-gray-900">{currentUser.firstName || 'N/A'} {currentUser.lastName || ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg text-gray-900">{currentUser.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg text-gray-900">{currentUser.createdAt || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Login</p>
              <p className="text-lg text-gray-900">{currentUser.lastLogin || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by username, email, or name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded pl-10 pr-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th
                onClick={() => handleSort('username')}
                className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Username
                  {sortField === 'username' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('email')}
                className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Email
                  {sortField === 'email' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('firstName')}
                className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  First Name
                  {sortField === 'firstName' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('lastName')}
                className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Last Name
                  {sortField === 'lastName' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('role')}
                className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Role
                  {sortField === 'role' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('isBlocked')}
                className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'isBlocked' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('createdAt')}
                className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 hidden md:table-cell transition-colors"
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('lastLogin')}
                className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200 hidden lg:table-cell transition-colors"
              >
                <div className="flex items-center gap-1">
                  Last Login
                  {sortField === 'lastLogin' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.length === 0 && !loading ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">
                  {users.length === 0 ? 'No users found. Please check if users are registered in the database.' : 'No users found matching your criteria.'}
                </td>
              </tr>
            ) : (
              sortedUsers.map(user => (
                <tr key={user.id} className={`${editingUserId === user.id || changingPasswordUserId === user.id ? 'bg-yellow-50' : 'hover:bg-gray-50'} transition-colors`}>
                  {editingUserId === user.id ? (
                    <>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={formData.lastName || ''}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={formData.role}
                          onChange={e => setFormData({ ...formData, role: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled
                        >
                          {roles.filter(r => r !== 'All').map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${formData.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {formData.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">{formData.createdAt}</td>
                      <td className="px-3 py-2 hidden lg:table-cell">{formData.lastLogin || 'N/A'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={saveEdit}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : changingPasswordUserId === user.id ? (
                    <>
                      <td className="px-3 py-2" colSpan="9">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-sm">Change Password for {user.username}:</span>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="border border-gray-300 rounded px-3 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            minLength="6"
                          />
                          <button
                            onClick={saveChangePassword}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            Save Password
                          </button>
                          <button
                            onClick={cancelChangePassword}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-sm">{user.username}</td>
                      <td className="px-3 py-2 text-sm">{user.email}</td>
                      <td className="px-3 py-2 text-sm">{user.firstName || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm">{user.lastName || 'N/A'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'Administrator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-sm">{user.createdAt || 'N/A'}</td>
                      <td className="px-3 py-2 hidden lg:table-cell text-sm">{user.lastLogin || 'N/A'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {/* Edit and Password buttons - only for own account */}
                          {user.id === currentUser?.id && (
                            <>
                              <button
                                onClick={() => startEdit(user)}
                                className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs mb-1 transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => startChangePassword(user)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs mb-1 transition-colors"
                                title="Change Password"
                              >
                                <Key className="w-3 h-3" />
                                Password
                              </button>
                            </>
                          )}
                          {/* Block and Hide buttons - only for non-admin users and only if current user is admin */}
                          {currentUser?.role === 'Administrator' && user.role !== 'Administrator' && user.id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => toggleBlock(user.id)}
                                className={`${user.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white px-2 py-1 rounded flex items-center gap-1 text-xs mb-1 transition-colors`}
                                title={user.isBlocked ? 'Unblock User' : 'Block User'}
                              >
                                {user.isBlocked ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                {user.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => hideUser(user.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs mb-1 transition-colors"
                                title="Hide User"
                              >
                                <Trash2 className="w-3 h-3" />
                                Hide
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;