
import React, { useState } from 'react';
import { Plus, Search, TrendingUp, DollarSign, ShoppingCart, Users, Edit2, Trash2, Eye, Download, Filter } from 'lucide-react';

export default function SalesManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample sales data
  const salesData = [
    {
      id: 'INV-001',
      date: '2025-10-15',
      customer: 'John Doe',
      type: 'Regular',
      items: [
        { product: '5 Gallon Container', quantity: 3, price: 25, total: 75 }
      ],
      subtotal: 75,
      discount: 0,
      total: 75,
      payment: 'Cash',
      status: 'Completed'
    },
    {
      id: 'INV-002',
      date: '2025-10-14',
      customer: 'Yes',
      type: 'Wholesale',
      items: [
        { product: '5 Gallon Container', quantity: 50, price: 20, total: 1000 }
      ],
      subtotal: 1000,
      discount: 100,
      total: 900,
      payment: 'Bank Transfer',
      status: 'Completed'
    },
    {
      id: 'INV-003',
      date: '2025-10-13',
      customer: 'Maria Santos',
      type: 'Regular',
      items: [
        { product: '5 Gallon Container', quantity: 2, price: 25, total: 50 }
      ],
      subtotal: 50,
      discount: 0,
      total: 50,
      payment: 'GCash',
      status: 'Pending'
    }
  ];

  const stats = {
    todaySales: 1025,
    weekSales: 5830,
    monthSales: 24500,
    totalOrders: 156,
    pendingOrders: 3,
    completedOrders: 153
  };

  const products = [
    { id: 1, name: '5 Gallon Container', price: 25, wholesalePrice: 20, stock: 150 },
    { id: 2, name: '1 Gallon Bottle', price: 35, wholesalePrice: 30, stock: 200 },
    { id: 3, name: 'Empty Container Deposit', price: 100, wholesalePrice: 100, stock: 50 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                  <p className="text-sm text-gray-500">Joy Purified Drinking Water</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Sale</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {['overview', 'sales', 'products'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Today's Sales</p>
                    <p className="text-3xl font-bold text-gray-900">₱{stats.todaySales.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">This Week</p>
                    <p className="text-3xl font-bold text-gray-900">₱{stats.weekSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">₱{stats.monthSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesData.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{sale.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Status</option>
                    <option>Completed</option>
                    <option>Pending</option>
                  </select>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Types</option>
                    <option>Regular</option>
                    <option>Wholesale</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesData.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sale.type === 'Wholesale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {sale.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{sale.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.payment}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Regular Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Wholesale Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₱{product.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₱{product.wholesalePrice}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="p-1 text-gray-600 hover:bg-gray-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">New Sale</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Select Customer</option>
                    <option>John Doe</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Regular</option>
                    <option>Wholesale</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>5 Gallon Container</option>
                  <option>1 Gallon Bottle</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Cash</option>
                    <option>GCash</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}