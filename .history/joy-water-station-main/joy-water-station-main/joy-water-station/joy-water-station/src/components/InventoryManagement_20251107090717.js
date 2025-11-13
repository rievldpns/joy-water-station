import React, { useState, useEffect } from 'react';
import { Search, Filter, History, Package, Edit2, Trash2 } from 'lucide-react';

const categories = ['All', 'Water Products', 'Containers', 'Accessories'];
const uomOptions = ['Pieces', 'Liters', 'Gallons', 'Boxes', 'Cases', 'Bottles', 'Cans', 'Packets'];

const InventoryManagement = ({ products, setProducts, setCurrentView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStockStatus, setFilterStockStatus] = useState('All');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingItemId, setEditingItemId] = useState(null);
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
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [stockForm, setStockForm] = useState({
    type: 'Stock In',
    quantity: '',
    reason: ''
  });
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' or 'error'
  });

  // Always fetch items from API and listen for updates
  useEffect(() => {
    let mounted = true;
    const loadItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/items');
        const data = await response.json();
        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load items:', err);
        setProducts([]);
      }
    };
    loadItems();

    // Listen for item updates from other components
    const handler = (e) => {
      const updated = Array.isArray(e.detail) ? e.detail : [];
      setProducts(updated);
    };
    window.addEventListener('items:updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('items:updated', handler);
    };
  }, [setProducts]);

  // filtered and sorted items
  const filteredItems = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStockStatus = filterStockStatus === 'All' || getStockStatus(item.currentStock, item.minStock, item.maxStock).status === filterStockStatus;
    return matchesSearch && matchesCategory && matchesStockStatus;
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
    try {
      const res = await fetch(`http://localhost:5000/api/items/${editingItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          currentStock: parseInt(formData.currentStock),
          minStock: parseInt(formData.minStock),
          maxStock: parseInt(formData.maxStock)
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state and notify other components
        const updatedProducts = products.map(product =>
          product.id === editingItemId ? data : product
        );
        setProducts(updatedProducts);
        window.dispatchEvent(new CustomEvent('items:updated', { detail: updatedProducts }));
        cancelEdit();
        setAlert({
          show: true,
          message: 'Item updated successfully',
          type: 'success'
        });
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
  };

  const deleteItem = (id) => {
    setAlert({
      show: true,
      message: 'Are you sure you want to delete this item?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/items/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            const updatedProducts = products.filter(product => product.id !== id);
            setProducts(updatedProducts);
            window.dispatchEvent(new CustomEvent('items:updated', { detail: updatedProducts }));
            setAlert({
              show: true,
              message: 'Item deleted successfully',
              type: 'success'
            });
          } else {
            throw new Error(data.message || 'Failed to delete item');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          setAlert({
            show: true,
            message: error.message || 'Network error. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  // Stock management functions
  const openStockModal = async (item) => {
    setSelectedItem(item);
    setShowStockModal(true);
    setStockForm({
      type: 'Stock In',
      quantity: '',
      reason: ''
    });

    // For now, use empty stock history since we're not using API
    setStockHistory([]);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedItem(null);
    setStockHistory([]);
  };

  const saveStockEntry = async () => {
    if (!stockForm.quantity || !selectedItem) {
      setAlert({
        show: true,
        message: 'Please enter quantity',
        type: 'error'
      });
      return;
    }

    // Update stock locally
    const quantityChange = stockForm.type === 'Stock In' ? parseInt(stockForm.quantity) : -parseInt(stockForm.quantity);
    const updatedProducts = products.map(product =>
      product.id === selectedItem.id ? {
        ...product,
        currentStock: Math.max(0, product.currentStock + quantityChange)
      } : product
    );
    setProducts(updatedProducts);

    // Add to stock history (local)
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: stockForm.type,
      quantity: parseInt(stockForm.quantity),
      reason: stockForm.reason,
      userName: 'Current User' // Since we don't have currentUser
    };
    setStockHistory(prev => [newEntry, ...prev]);

    setStockForm({
      type: 'Stock In',
      quantity: '',
      reason: ''
    });
    setAlert({
      show: true,
      message: 'Stock entry saved successfully',
      type: 'success'
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Inventory Management</h1>

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
          <select
            value={filterStockStatus}
            onChange={e => setFilterStockStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="All">All Stock Status</option>
            <option value="Sufficient">Sufficient</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

      </div>

      {/* items table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                      <select
                        value={formData.uom}
                        onChange={e => setFormData({ ...formData, uom: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Select UOM</option>
                        <option value="Pieces">Pieces</option>
                        <option value="Liters">Liters</option>
                        <option value="Gallons">Gallons</option>
                        <option value="Boxes">Boxes</option>
                        <option value="Cases">Cases</option>
                        <option value="Bottles">Bottles</option>
                        <option value="Cans">Cans</option>
                        <option value="Packets">Packets</option>
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
                    <td className="px-6 py-2">
                      <button
                        onClick={() => openStockModal(item)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="px-6 py-2">{item.category}</td>
                    <td className="px-6 py-2">{item.currentStock}</td>
                    <td className="px-6 py-2">{item.uom}</td>
                    <td className="px-6 py-2">₱{parseFloat(item.price).toFixed(2)}</td>
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
                          onClick={() => openStockModal(item)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <Package className="w-4 h-4" />
                          Stock
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sortedItems.length === 0 && (
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

      {/* Stock Management Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Stock Management - {selectedItem.name}</h2>
              <button onClick={closeStockModal} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Stock Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current Stock Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className="font-semibold ml-2">{selectedItem.currentStock}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Unit of Measure:</span>
                    <span className="font-semibold ml-2">{selectedItem.uom}</span>
                  </div>
                </div>
              </div>

              {/* Add Stock Entry Form */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Add Stock Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={stockForm.type}
                      onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="Stock In">Stock In</option>
                      <option value="Stock Out">Stock Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                    <input
                      type="text"
                      value={stockForm.reason}
                      onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Reason for stock change"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={saveStockEntry}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Stock Entry
                  </button>
                </div>
              </div>

              {/* Stock History Table */}
              <div>
                <h3 className="font-semibold mb-4">Stock History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.type === 'Stock In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{entry.quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{entry.reason || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{entry.userName || 'Unknown'}</td>
                        </tr>
                      ))}
                      {stockHistory.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No stock history found for this item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
