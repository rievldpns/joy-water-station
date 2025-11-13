import React, { useState } from 'react';
import { Edit2, Save, X, UserX, UserCheck, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Filtered and sorted users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
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

  // Summary statistics
  const totalUsers = users.length;
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
    // Prevent editing admin accounts
    if (user.role === 'Administrator') {
      alert('Cannot edit administrator accounts');
      return;
    }
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
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
        alert('User updated successfully');
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
      alert('Cannot block administrator accounts');
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

      {/* Summary dashboard */}
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
          <p className="text-sm text-gray-600">Blocked Users</p>
          <p className="text-xl font-bold">{blockedUsers}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Administrators</p>
          <p className="text-xl font-bold">{users.filter(u => u.role === 'Administrator').length}</p>
        </div>
      </div>

      {/* Your account information */}
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
            <p className="text-lg text-gray-900">{currentUser?.lastLogin || 'N/A'}</p>
          </div>
        </div>
      </div>

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
              className="border border-gray-300 rounded pl-10 pr-3 py-2 w-64"
            />
          </div>
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

      {/* Users table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['username', 'email', 'firstName', 'lastName', 'role', 'isBlocked', 'createdAt', 'lastLogin'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    {field === 'firstName' ? 'First Name' :
                      field === 'lastName' ? 'Last Name' :
                        field === 'isBlocked' ? 'Status' :
                          field === 'createdAt' ? 'Created' :
                            field === 'lastLogin' ? 'Last Login' :
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
              <tr key={user.id} className={editingUserId === user.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                {editingUserId === user.id ? (
                  <>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        required
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        required
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
                    <td className="px-6 py-2">{formData.lastLogin || 'N/A'}</td>
                    <td className="px-6 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-2">{user.username}</td>
                    <td className="px-6 py-2">{user.email}</td>
                    <td className="px-6 py-2">{user.firstName || 'N/A'}</td>
                    <td className="px-6 py-2">{user.lastName || 'N/A'}</td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${user.role === 'Administrator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-2">{user.createdAt}</td>
                    <td className="px-6 py-2">
                      <div className="flex gap-2">
                        {user.role !== 'Administrator' && (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => toggleBlock(user.id)}
                              className={user.isBlocked ? 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm' : 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm'}
                              title={user.isBlocked ? 'Unblock User' : 'Block User'}
                            >
                              {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => hideUser(user.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                              title="Hide User"
                            >
                              <Trash2 className="w-4 h-4" />
                              Hide
                            </button>
                          </>
                        )}
                        {user.role === 'Administrator' && (
                          <span className="text-sm text-gray-500 italic">Protected Account</span>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}