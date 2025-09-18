import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

const categories = ['All', 'Water Products', 'Containers', 'Accessories'];

const InventoryManagement = ({ products, setProducts, setCurrentView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Water Products',
    price: '',
    uom: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    description: '',
  });

  // filtered and sorted items
  const filteredItems = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStockStatus = (current, min, max) => {
    if (current === 0) return { status: 'Out of Stock', color: 'red' };
    if (current <= min) return { status: 'Low Stock', color: 'yellow' };
    return { status: 'Sufficient', color: 'green' };
  };

  // summary statistics
  const totalItems = products.length;
  const categoriesCount = categories.reduce((acc, cat) => {
    if (cat === 'All') return acc;
    acc[cat] = products.filter(item => item.category === cat).length;
    return acc;
  }, {});
  const stockStatusCounts = products.reduce((acc, item) => {
    const status = getStockStatus(item.currentStock, item.minStock, item.maxStock).status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setFormData({
      name: '',
      category: 'Water Products',
      price: '',
      uom: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      description: '',
    });
    setNewItem(null);
  };

  const saveEdit = () => {
    if (!formData.name || !formData.category) {
      alert('Please fill in required fields: Name, Category');
      return;
    }
    if (newItem) {
      const newId = products.length > 0 ? Math.max(...products.map(i => i.id)) + 1 : 1;
      setProducts([...products, { id: newId, ...formData, price: parseFloat(formData.price), currentStock: parseInt(formData.currentStock), minStock: parseInt(formData.minStock), maxStock: parseInt(formData.maxStock) }]);
    } else {
      setProducts(products.map(item => item.id === editingItemId ? { ...formData, price: parseFloat(formData.price), currentStock: parseInt(formData.currentStock), minStock: parseInt(formData.minStock), maxStock: parseInt(formData.maxStock) } : item));
    }
    cancelEdit();
  };

  const deleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setProducts(products.filter(item => item.id !== id));
    }
  };

  const addNewItem = () => {
    setNewItem(true);
    setEditingItemId(null);
    setFormData({
      name: '',
      category: 'Water Products',
      price: '',
      uom: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      description: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Inventory Management</h1>

      {/* summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-xl font-bold">{totalItems}</p>
        </div>
        {Object.entries(categoriesCount).map(([cat, count]) => (
          <div key={cat} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">{cat}</p>
            <p className="text-xl font-bold">{count}</p>
          </div>
        ))}
        {Object.entries(stockStatusCounts).map(([status, count]) => (
          <div key={status} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">{status}</p>
            <p className="text-xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={addNewItem}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      {/* items table */}
      <div className="bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit of Measure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newItem && (
              <tr className="bg-green-50">
                <td className="px-6 py-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Name"
                  />
                </td>
                <td className="px-6 py-2">
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-2">
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={e => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Quantity"
                    min="0"
                  />
                </td>
                <td className="px-6 py-2">
                  <input
                    type="text"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="UNIT OF MEASUREMENT"
                  />
                </td>
                <td className="px-6 py-2">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-6 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">New</span>
                  </div>
                </td>
                <td className="px-6 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {sortedItems.map(item => (
              <tr key={item.id} className={editingItemId === item.id ? 'bg-yellow-50' : ''}>
                {editingItemId === item.id ? (
                  <>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      >
                        {categories.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        value={formData.currentStock}
                        onChange={e => setFormData({ ...formData, currentStock: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={formData.uom}
                        onChange={e => setFormData({ ...formData, uom: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-2">
                      {(() => {
                        const status = getStockStatus(parseInt(formData.currentStock), item.minStock, item.maxStock);
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full bg-${status.color}-500`}></div>
                          <span className="text-sm">{status.status}</span>
                        </div>
                      );
                    })()}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-2">{item.name}</td>
                    <td className="px-6 py-2">{item.category}</td>
                    <td className="px-6 py-2">{item.currentStock}</td>
                    <td className="px-6 py-2">{item.uom}</td>
                    <td className="px-6 py-2">₱{item.price.toFixed(2)}</td>
                    <td className="px-6 py-2">
                      {(() => {
                        const status = getStockStatus(item.currentStock, item.minStock, item.maxStock);
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full bg-${status.color}-500`}></div>
                          <span className="text-sm">{status.status}</span>
                        </div>
                      );
                    })()}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedItems.length === 0 && !newItem && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManagement;
