import React, { useState } from 'react';
import { Edit2, Save, X, UserX, UserCheck, Trash2, Search, Filter, ChevronDown, ChevronUp, User, Lock, Users, UserPlus } from 'lucide-react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

const roles = ['All', 'User', 'Administrator'];

export default function UserManagement({ users, setUsers, currentUser, setCurrentView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    role: 'User',
  });

  // filtered and sorted users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // summary statistics
  const totalUsers = users.length;
  const rolesCount = roles.reduce((acc, role) => {
    if (role === 'All') return acc;
    acc[role] = users.filter(user => user.role === role).length;
    return acc;
  }, {});
  const blockedUsers = users.filter(user => user.isBlocked).length;

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({ ...user });
  };

  const cancelEdit = () => {
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
  };

  const saveEdit = () => {
    // Prevent editing admin account
    const userToEdit = users.find(u => u.id === editingUserId);
    if (userToEdit && userToEdit.role === 'Administrator') {
      alert('Cannot edit administrator accounts');
      return;
    }

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

    setUsers(users.map(user => user.id === editingUserId ? { ...formData } : user));
    cancelEdit();
  };

  const hideUser = async (id) => {
    if (window.confirm('Are you sure you want to hide this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${id}/hide`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Refresh users list
          const usersResponse = await fetch('/api/users/all', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (usersResponse.ok) {
            const updatedUsers = await usersResponse.json();
            setUsers(updatedUsers);
          }
          alert('User hidden successfully');
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
      alert('Cannot block admin users');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const action = user.isBlocked ? 'unblock' : 'block';
      const response = await fetch(`/api/users/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh users list
        const usersResponse = await fetch('/api/users/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (usersResponse.ok) {
          const updatedUsers = await usersResponse.json();
          setUsers(updatedUsers);
        }
        alert(`User ${action}ed successfully`);
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Toggle block error:`, error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">User Management</h1>

      {/* summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-xl font-bold">{users.filter(u => !u.isBlocked).length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-xl font-bold">{users.filter(u => u.role === 'Administrator').length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">New Users</p>
          <p className="text-xl font-bold">{users.filter(u => u.createdAt === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>

      {/* your account information */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
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

      {/* controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by username, email, or name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* users table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['username', 'email', 'firstName', 'lastName', 'role', 'isBlocked', 'createdAt'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {field === 'firstName' ? 'First Name' :
                      field === 'lastName' ? 'Last Name' :
                        field === 'isBlocked' ? 'Status' :
                          field === 'createdAt' ? 'Created' :
                            field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.map(user => (
              <tr key={user.id} className={editingUserId === user.id ? 'bg-yellow-50' : ''}>
                {editingUserId === user.id ? (
                  <>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      >
                        {roles.filter(r => r !== 'All').map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${formData.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {formData.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-2">{formData.createdAt}</td>
                    <td className="px-6 py-2 flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-2">{user.username}</td>
                    <td className="px-6 py-2">{user.email}</td>
                    <td className="px-6 py-2">{user.firstName || 'N/A'}</td>
                    <td className="px-6 py-2">{user.lastName || 'N/A'}</td>
                    <td className="px-6 py-2">{user.role}</td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-2">{user.createdAt}</td>
                    <td className="px-6 py-2 flex gap-2">
                      {user.role !== 'Administrator' && (
                        <button
                          onClick={() => startEdit(user)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {user.role !== 'Administrator' && (
                        <button
                          onClick={() => toggleBlock(user.id)}
                          className={user.isBlocked ? 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-2' : 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-2'}
                        >
                          {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                      <button
                        onClick={() => hideUser(user.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hide
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* quick actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentView('profile')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex items-center gap-4 transition-colors duration-200"
          >
            <User className="w-5 h-5" />
            <span>Manage Profile</span>
          </button>
          <button
            onClick={() => setCurrentView('password')}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center gap-4 transition-colors duration-200"
          >
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </button>
          {currentUser?.role === 'Administrator' && (
            <button
              onClick={() => setCurrentView('users')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg flex items-center gap-4 transition-colors duration-200"
            >
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
            </button>
          )}
          <button
            onClick={() => setCurrentView('register')}
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg flex items-center gap-4 transition-colors duration-200"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>
    </div>
  );
}
