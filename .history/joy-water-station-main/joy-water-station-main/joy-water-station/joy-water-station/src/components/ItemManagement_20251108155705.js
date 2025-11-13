import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Plus, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

const categories = ['All', 'Water Products', 'Containers', 'Accessories'];
const uomOptions = ['Pieces', 'Liters', 'Gallons', 'Boxes', 'Cases', 'Bottles', 'Cans', 'Packets'];

// Add API base (use REACT_APP_API_URL if provided, otherwise fallback)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ItemManagement() {
  const [items, setItems] = useState([]);
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
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' or 'error'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch items from API
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchItems = () => {
    fetch('http://localhost:5000/api/items')
      .then(response => response.json())
      .then(data => {
        console.log('Fetched data:', data); // Debug log
        // Handle different response formats
        let resolved = [];
        if (Array.isArray(data)) {
          resolved = data;
        } else if (data && data.items && Array.isArray(data.items)) {
          resolved = data.items;
        } else if (data && typeof data === 'object') {
          // If it's an object, try to convert it to an array
          resolved = Object.values(data);
        } else {
          resolved = [];
        }
        setItems(resolved);
        // Notify other components (SalesManagement) that items changed
        try { window.dispatchEvent(new CustomEvent('items:updated', { detail: resolved })); } catch (e) { /* ignore */ }
      })
      .catch(error => {
        console.error('Error fetching items:', error);
        setItems([]);
        try { window.dispatchEvent(new CustomEvent('items:updated', { detail: [] })); } catch (e) { /* ignore */ }
        setAlert({
          show: true,
          message: 'Failed to load items. Please check if the backend is running.',
          type: 'error'
        });
      });
  };

  // filtered and sorted items
  const filteredItems = items.filter(item => {
    const matchesSearch = item && item.name ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesCategory = filterCategory === 'All' || (item && item.category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle numeric fields
    if (sortField === 'price') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    } else {
      // Handle string fields
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
    }

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

  const saveEdit = async () => {
    if (!formData.name || !formData.category) {
      setAlert({
        show: true,
        message: 'Please fill in required fields: Name, Category',
        type: 'error'
      });
      return;
    }
    if (newItem) {
      // Add new item via API
      try {
        const res = await fetch(`${API_BASE}/api/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            price: parseFloat(formData.price) || 0,
            currentStock: 0,
            minStock: 0,
            maxStock: 0
          })
        });
        const data = await res.json();
        if (res.ok) {
          await fetchItems();
          cancelEdit();
          setAlert({
            show: true,
            message: 'Item added successfully',
            type: 'success'
          });
          // Notify InventoryManagement component
          window.dispatchEvent(new CustomEvent('items:updated', { detail: [...items, data] }));
        } else {
          throw new Error(data.message || 'Failed to add item');
        }
      } catch (err) {
        console.error('Error adding item:', err);
        setAlert({
          show: true,
          message: err.message || 'Failed to add item',
          type: 'error'
        });
      }
    } else {
      // Update item via API
      try {
        const res = await fetch(`${API_BASE}/api/items/${editingItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            price: parseFloat(formData.price) || 0
          })
        });
        const data = await res.json();
        if (res.ok) {
          await fetchItems();
          cancelEdit();
          setAlert({
            show: true,
            message: 'Item updated successfully',
            type: 'success'
          });
          // Notify InventoryManagement component
          window.dispatchEvent(new CustomEvent('items:updated', { detail: items.map(item => item.id === editingItemId ? data : item) }));
        } else {
          throw new Error(data.message || 'Failed to update item');
        }
      } catch (err) {
        console.error('Error updating item:', err);
        setAlert({
          show: true,
          message: err.message || 'Failed to update item',
          type: 'error'
        });
      }
    }
  };

  const deleteItem = (id) => {
    setAlert({
      show: true,
      message: 'Are you sure you want to delete this item?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/items/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            await fetchItems();
            setAlert({ show: true, message: 'Item deleted successfully', type: 'success' });
            // Notify InventoryManagement component
            window.dispatchEvent(new CustomEvent('items:updated', { detail: items.filter(item => item.id !== id) }));
          } else {
            throw new Error(data.message || 'Failed to delete item');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          setAlert({ show: true, message: error.message || 'Network error. Please try again.', type: 'error' });
        }
      }
    });
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

      {/* Simple loading / error UI */}
      {loading && <div className="mb-4 text-sm text-gray-600">Loading items...</div>}
      {!loading && errorMsg && <div className="mb-4 text-sm text-red-600">{errorMsg}</div>}

      {/* Custom Alert */}
      {alert.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              {alert.type === 'success' && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              {alert.type === 'error' && (
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
              {alert.type === 'confirm' && (
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {alert.type === 'confirm' ? 'Confirm Action' : alert.type === 'success' ? 'Success' : 'Error'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">{alert.message}</p>
            <div className="flex justify-end space-x-3">
              {alert.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setAlert({ show: false, message: '', type: 'success' })}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert.onConfirm();
                      setAlert({ show: false, message: '', type: 'success' });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAlert({ show: false, message: '', type: 'success' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <select
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Select UOM</option>
                    {uomOptions.map(uom => (
                      <option key={uom} value={uom}>{uom}</option>
                    ))}
                  </select>
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
                      <select
                        value={formData.uom}
                        onChange={e => setFormData({ ...formData, uom: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Select UOM</option>
                        {uomOptions.map(uom => (
                          <option key={uom} value={uom}>{uom}</option>
                        ))}
                      </select>
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
                    <td className="px-6 py-2">₱{parseFloat(item.price || 0).toFixed(2)}</td>
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
