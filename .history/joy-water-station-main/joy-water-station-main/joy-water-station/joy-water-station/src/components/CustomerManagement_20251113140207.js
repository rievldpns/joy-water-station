import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Plus, Search, ChevronDown, ChevronUp, ShoppingCart, Users, UserSquare } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

// API helper function
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

const customerTypes = ['All', 'Regular', 'Wholesale', 'Corporate'];
const statusOptions = ['All', 'Active', 'Inactive', 'Hidden'];
const viewOptions = ['Active', 'Hidden', 'All'];

export default function CustomerManagement({ customers, setCustomers }) {
  // Initialize customers if empty
  useEffect(() => {
    if (!customers || customers.length === 0) {
      setCustomers(initialCustomers);
    }
  }, [customers, setCustomers]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [newCustomer, setNewCustomer] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [customerToArchive, setCustomerToArchive] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'Regular',
    status: 'Active',
    hidden: false
  });

  // Filtered and sorted customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || customer.type === filterType;
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Hidden' ? customer.hidden : 
       filterStatus === 'Active' ? (!customer.hidden && customer.status === 'Active') :
       customer.status === filterStatus && !customer.hidden);
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const typeStats = customerTypes.reduce((acc, type) => {
    if (type === 'All') return acc;
    acc[type] = customers.filter(c => c.type === type).length;
    return acc;
  }, {});

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEdit = (customer) => {
    setEditingCustomerId(customer.id);
    setFormData({ ...customer });
  };

  const cancelEdit = () => {
    setEditingCustomerId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'Regular',
      status: 'Active',
      hidden: false
    });
    setNewCustomer(null);
  };

  const saveEdit = () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill in required fields: Name and Phone');
      return;
    }

    if (newCustomer) {
      const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      const currentDate = new Date().toISOString().split('T')[0];
      setCustomers([...customers, {
        id: newId,
        ...formData,
        lastOrder: currentDate,
        totalOrders: 0
      }]);
    } else {
      setCustomers(customers.map(customer =>
        customer.id === editingCustomerId ? { ...customer, ...formData } : customer
      ));
    }
    cancelEdit();
  };

  const initiateHideCustomer = (id) => {
    setCustomerToArchive(id);
    setShowArchiveModal(true);
  };

  const confirmHideCustomer = () => {
    if (customerToArchive) {
      setCustomers(customers.map(customer =>
        customer.id === customerToArchive ? { ...customer, hidden: true } : customer
      ));
    }
    setShowArchiveModal(false);
    setCustomerToArchive(null);
  };

  const cancelHideCustomer = () => {
    setShowArchiveModal(false);
    setCustomerToArchive(null);
  };

  const restoreCustomer = (id) => {
    setCustomers(customers.map(customer =>
      customer.id === id ? { ...customer, hidden: false } : customer
    ));
  };

  const addNewCustomer = () => {
    setNewCustomer(true);
    setEditingCustomerId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'Regular',
      status: 'Active'
    });
  };

  return (
    <div className="p-6">
      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Archive Customer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive this customer? They will be moved to the Hidden list.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelHideCustomer}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmHideCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">Manage and track your water station customers</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {customerTypes.slice(1).map(type => (
          <div key={type} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{type} Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{typeStats[type]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {customerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <button
                onClick={addNewCustomer}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { field: 'name', label: 'Name' },
                  { field: 'phone', label: 'Phone' },
                  { field: 'email', label: 'Email' },
                  { field: 'type', label: 'Type' },
                  { field: 'lastOrder', label: 'Last Order' },
                  { field: 'totalOrders', label: 'Total Orders' },
                  { field: 'status', label: 'Status' },
                  { field: 'actions', label: 'Actions' }
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => field !== 'actions' && handleSort(field)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      {sortField === field && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newCustomer && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Customer Name"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Phone Number"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Email Address"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      {customerTypes.slice(1).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">0</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      {statusOptions.slice(1, -1).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-900"
                        title="Save Customer"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {sortedCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomerId === customer.id ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomerId === customer.id ? (
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomerId === customer.id ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomerId === customer.id ? (
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        {customerTypes.slice(1).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${customer.type === 'Regular' ? 'bg-green-100 text-green-800' : 
                          customer.type === 'Wholesale' ? 'bg-blue-100 text-blue-800' : 
                          'bg-purple-100 text-purple-800'}`}>
                        {customer.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.lastOrder}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.totalOrders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomerId === customer.id ? (
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        {statusOptions.slice(1).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {customer.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingCustomerId === customer.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {!customer.hidden ? (
                          <button
                            onClick={() => initiateHideCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Archive Customer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreCustomer(customer.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Restore Customer"
                          >
                            <UserSquare className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
