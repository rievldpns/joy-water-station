import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Plus, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

const categories = ['All', 'Water Products', 'Containers', 'Accessories'];

export default function ItemManagement({ items, setItems }) {
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
    description: '',
  });

  // filtered and sorted items
  const filteredItems = items.filter(item => {
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

  // summary statistics
  const totalItems = items.length;
  const categoriesCount = categories.reduce((acc, cat) => {
    if (cat === 'All') return acc;
    acc[cat] = items.filter(item => item.category === cat).length;
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
      const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
      setItems([...items, { id: newId, ...formData, price: parseFloat(formData.price) }]);
    } else {
      setItems(items.map(item => item.id === editingItemId ? { ...formData, price: parseFloat(formData.price) } : item));
    }
    cancelEdit();
  };

  const deleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
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
      description: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Item Management</h1>

      {/* summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['name', 'category', 'price', 'uom', 'description'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : null}
                  </div>
                </th>
              ))}
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
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Price"
                    min="0"
                    step="0.01"
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
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Description"
                  />
                </td>
                <td className="px-6 py-2 flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
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
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        min="0"
                        step="0.01"
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
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-2 flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-2">{item.name}</td>
                    <td className="px-6 py-2">{item.category}</td>
                    <td className="px-6 py-2">₱{item.price.toFixed(2)}</td>
                    <td className="px-6 py-2">{item.uom}</td>
                    <td className="px-6 py-2">{item.description}</td>
                    <td className="px-6 py-2 flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedItems.length === 0 && !newItem && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
