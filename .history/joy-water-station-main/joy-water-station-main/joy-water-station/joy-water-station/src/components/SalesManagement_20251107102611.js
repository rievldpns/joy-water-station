import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, TrendingUp, DollarSign, ShoppingCart, Edit2, Trash2, Eye, Download, X, Save, AlertCircle, CheckCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

function formatCurrency(n) {
  if (isNaN(n)) return '₱0.00';
  return `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// API helper function
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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

export default function SalesManagement({ 
  sales = [], 
  setSales = () => {}, 
  customers = [], 
  items = [],
  setItems = () => {},
  products = [], // Add default empty array for products
  setProducts = () => {},
  deliveries = [],
  setDeliveries = () => {} 
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState({ type: 'info', title: '', message: '' });
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [viewSale, setViewSale] = useState(null);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    customerType: 'Regular',
    transactionType: 'Walk-in',
    deliveryType: 'Walk-in',
    items: [{ itemId: '', quantity: 1, price: 0 }],
    discount: 0,
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: ''
  });

  const pushToast = useCallback((type, text, ttl = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
  }, []);

  // Always fetch items from API and listen for updates
  useEffect(() => {
    let mounted = true;
    const loadItems = async () => {
      try {
        const data = await apiRequest('/items');
        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load items:', err);
        pushToast('error', 'Failed to load inventory items');
      }
    };
    loadItems();

    // Listen for item updates from other components
    const handler = (e) => {
      const updated = Array.isArray(e.detail) ? e.detail : [];
      setProducts(updated);
      pushToast('success', 'Inventory updated');
    };
    window.addEventListener('items:updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('items:updated', handler);
    };
  }, [setProducts, pushToast]);

  // Re-fetch items after sales to ensure stock is updated
  const refetchItems = async () => {
    try {
      const data = await apiRequest('/items');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to refetch items:', err);
    }
  };

  const showAlert = (type, title, message) => {
    setAlertData({ type, title, message });
    setShowAlertModal(true);
  };

  const calculateSubtotal = (saleItems) => saleItems.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
  const calculateTotal = (subtotal, discount) => subtotal - parseFloat(discount || 0);
  const getCustomerName = (customerId) => customers.find(c => c.id === parseInt(customerId))?.name || 'Unknown Customer';
  const getItem = (itemId) => {
    if (!itemId || !Array.isArray(products)) return null;
    const item = products.find(p => p.id === parseInt(itemId));
    return item || null;
  };

  // Get unique customer types from customers data
  const uniqueCustomerTypes = [...new Set(customers.map(c => c.type).filter(Boolean))];

  // Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = (sales || []).filter(s => s.date.startsWith(todayStr)).reduce((sum, s) => sum + (s.total || 0), 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekSales = (sales || []).filter(s => new Date(s.date) >= weekStart).reduce((sum, s) => sum + (s.total || 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthSales = (sales || []).filter(s => new Date(s.date) >= monthStart).reduce((sum, s) => sum + (s.total || 0), 0);
  
  const totalOrders = (sales || []).length;
  const pendingOrders = (sales || []).filter(s => s.status === 'Pending').length;
  const completedOrders = (sales || []).filter(s => s.status === 'Completed').length;

  const filteredSales = (sales || []).filter(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const matchesSearch = (customer?.name || sale.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sale.status === filterStatus;
    const matchesType = filterType === 'All' || sale.customerType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const openAddModal = () => {
    setEditingSaleId(null);
    setFormData({
      customerId: '',
      customerType: 'Regular',
      transactionType: 'Walk-in',
      deliveryType: 'Walk-in',
      items: [{ itemId: '', quantity: 1, price: 0 }],
      discount: 0,
      paymentMethod: 'Cash',
      status: 'Completed',
      notes: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (sale) => {
    setEditingSaleId(sale.id);
    setFormData({
      customerId: sale.customerId.toString(),
      customerType: sale.customerType,
      transactionType: sale.transactionType || 'Walk-in',
      deliveryType: sale.deliveryType || 'Walk-in',
      items: sale.items.map(it => ({ ...it })),
      discount: sale.discount,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      notes: sale.notes || ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingSaleId(null);
  };

  const addItemRow = () => setFormData(prev => ({ ...prev, items: [...prev.items, { itemId: '', quantity: 1, price: 0 }] }));
  const removeItemRow = (index) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  // Fix: updateItemRow to always reflect price and quantity from selected item
  const updateItemRow = (index, field, value) => {
    if (!Array.isArray(products)) return;
    setFormData(prev => {
      const newItems = prev.items.map((it, i) => {
        if (i !== index) return it;
        let updated = { ...it, [field]: value };
        if (field === 'itemId' && value) {
          const item = getItem(value);
          if (item) {
            updated.price = item.price || 0;
            updated.quantity = 1;
          }
        }
        if (field === 'quantity') {
          const itemId = updated.itemId;
          const item = getItem(itemId);
          if (item) {
            if (value > item.currentStock) {
              pushToast('error', `Maximum available quantity for ${item.name} is ${item.currentStock}`);
              updated.quantity = item.currentStock;
            } else if (value < 1) {
              updated.quantity = 1;
            }
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  // No need to refetch data since state is managed by parent

  // Save Sale button handler
  const saveSale = async () => {
    if (!formData.customerId || formData.items.length === 0 || !formData.items[0].itemId) {
      pushToast('error', 'Please fill required fields: Customer and at least one item');
      return;
    }
    if (!formData.transactionType) {
      pushToast('error', 'Please select transaction type');
      return;
    }

    const saleData = {
      id: editingSaleId || Date.now(),
      invoiceId: editingSaleId ? sales.find(s => s.id === editingSaleId)?.invoiceId : `INV-${Date.now()}`,
      date: new Date().toISOString(),
      customerId: parseInt(formData.customerId),
      customerType: formData.customerType,
      transactionType: formData.transactionType,
      deliveryType: formData.deliveryType,
      items: formData.items.map(it => ({
        itemId: parseInt(it.itemId),
        quantity: parseInt(it.quantity),
        price: parseFloat(it.price)
      })),
      subtotal: calculateSubtotal(formData.items),
      discount: parseFloat(formData.discount) || 0,
      total: calculateTotal(calculateSubtotal(formData.items), parseFloat(formData.discount) || 0),
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes
    };

    try {
      // Update inventory via backend API
      if (formData.status === 'Completed') {
        const stockUpdates = formData.items.map(it => ({
          id: parseInt(it.itemId),
          quantity: parseInt(it.quantity),
          type: 'decrease'
        }));
        await apiRequest('/items/bulk/stock', {
          method: 'PUT',
          body: JSON.stringify({ updates: stockUpdates })
        });
      }

      // Update local products state
      const updatedProducts = [...products];
      formData.items.forEach(it => {
        const productIndex = updatedProducts.findIndex(p => p.id === parseInt(it.itemId));
        if (productIndex !== -1) {
          updatedProducts[productIndex].currentStock = Math.max(0, updatedProducts[productIndex].currentStock - parseInt(it.quantity));
        }
      });
      setProducts(updatedProducts);

      // Create delivery if transaction type is "Delivery"
      if (formData.transactionType === 'Delivery') {
        const customer = customers.find(c => c.id === parseInt(formData.customerId));
        const deliveryData = {
          id: `DEL-${Date.now()}`,
          customerName: customer?.name || 'Unknown Customer',
          address: customer?.address || 'Address not provided',
          phone: customer?.phone || 'Phone not provided',
          items: formData.items.map(it => {
            const item = products.find(p => p.id === parseInt(it.itemId));
            return {
              name: item?.name || 'Unknown Item',
              quantity: parseInt(it.quantity)
            };
          }),
          scheduledTime: 'Not set',
          status: 'pending',
          priority: 'medium',
          distance: 'Calculating...',
          estimatedTime: 'Not set',
          currentLocation: { lat: 7.1907, lng: 125.4553 }, // Default Davao coordinates
          destination: { lat: 7.1907, lng: 125.4553 }, // Will be updated with actual coordinates
          lastUpdate: new Date(),
          saleId: saleData.id // Link to the sale
        };

        setDeliveries(prev => [...prev, deliveryData]);
      }

      // Re-fetch items to ensure stock is updated across all components
      await refetchItems();

      if (editingSaleId) {
        // Update existing sale locally
        setSales(prev => prev.map(sale => sale.id === editingSaleId ? saleData : sale));
        pushToast('success', 'Sale updated successfully');
      } else {
        // Create new sale locally
        setSales([...sales, saleData]);
        pushToast('success', 'Sale created successfully');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving sale:', error);
      pushToast('error', error.message || 'Failed to save sale');
    }
  };

  const initiateDeleteSale = (id) => {
    setSaleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      try {
        // Restore inventory via backend API if sale was completed
        const saleToDeleteData = sales.find(s => s.id === saleToDelete);
        if (saleToDeleteData && saleToDeleteData.status === 'Completed') {
          const stockUpdates = saleToDeleteData.items.map(it => ({
            id: parseInt(it.itemId),
            quantity: parseInt(it.quantity),
            type: 'increase'
          }));
          await apiRequest('/items/bulk/stock', {
            method: 'PUT',
            body: JSON.stringify({ updates: stockUpdates })
          });
        }

        // Restore inventory locally
        if (saleToDeleteData) {
          const updatedProducts = [...products];
          saleToDeleteData.items.forEach(it => {
            const productIndex = updatedProducts.findIndex(p => p.id === parseInt(it.itemId));
            if (productIndex !== -1) {
              updatedProducts[productIndex].currentStock += parseInt(it.quantity);
            }
          });
          setProducts(updatedProducts);
          window.dispatchEvent(new CustomEvent('items:updated', { detail: updatedProducts }));

          // Delete associated delivery if it exists
          setDeliveries(prev => prev.filter(delivery => delivery.saleId !== saleToDelete));
        }

        // Delete sale locally
        setSales(prev => prev.filter(sale => sale.id !== saleToDelete));
        pushToast('success', 'Sale deleted successfully');
      } catch (error) {
        console.error('Error deleting sale:', error);
        pushToast('error', error.message || 'Failed to delete sale');
      }
    }
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  const cancelDeleteSale = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  const openViewModal = (sale) => {
    setViewSale(sale);
  };

  const closeViewModal = () => {
    setViewSale(null);
  };

  const printReceipt = (sale) => {
    const customer = customers.find(c => c.id === sale.customerId) || {};
    const itemsHtml = sale.items.map(it => {
      const itemRef = getItem(it.itemId) || {};
      const lineTotal = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0);
      return `<tr><td style="padding:8px">${itemRef.name || 'Unknown'}</td><td style="padding:8px; text-align:center">${it.quantity}</td><td style="padding:8px; text-align:right">${formatCurrency(it.price)}</td><td style="padding:8px; text-align:right">${formatCurrency(lineTotal)}</td></tr>`;
    }).join('');

    const html = `<html><head><title>Receipt ${sale.invoiceId}</title><style>@page { size: A4; margin: 0.5in; } body { font-family: Arial, sans-serif; padding: 0; color: #1f2937; font-size: 14px; line-height: 1.4; } .container { border: 2px solid #e5e7eb; padding: 30px; border-radius: 8px; max-width: none; margin: 0; } .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; } .header h1 { margin: 0; font-size: 32px; color: #1f2937; font-weight: bold; } .header p { margin: 8px 0; color: #6b7280; font-size: 16px; } .invoice-info { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 15px; } .invoice-info div { } .invoice-info strong { display: block; color: #1f2937; font-weight: bold; } table { width: 100%; border-collapse: collapse; margin: 25px 0; } th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #3b82f6; font-weight: 600; color: #1f2937; font-size: 16px; background-color: #f9fafb; } td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 15px; } .totals { border-top: 2px solid #e5e7eb; font-weight: 600; margin-top: 20px; } .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 16px; } .total-row.final { border-bottom: 2px solid #3b82f6; border-top: 2px solid #3b82f6; font-size: 18px; font-weight: 700; color: #1f2937; padding: 15px 0; background-color: #f0f9ff; } .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 15px; } .footer div { margin: 8px 0; } .right { text-align: right; }</style></head><body><div class="container"><div class="header"><h1>Joy Water Station</h1><p>${customer.name || 'Walk-in Customer'}</p><p>${customer.phone || ''}</p></div><div class="invoice-info"><div><strong>Invoice:</strong> ${sale.invoiceId}</div><div><strong>Date:</strong> ${new Date(sale.date).toLocaleString()}</div></div><table><thead><tr><th>Item</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total-row"><span>Subtotal</span><span class="right">${formatCurrency(sale.subtotal)}</span></div><div class="total-row"><span>Discount</span><span class="right">${formatCurrency(sale.discount)}</span></div><div class="total-row final"><span>TOTAL</span><span class="right">${formatCurrency(sale.total)}</span></div><div class="footer"><div><strong>Payment Method:</strong> ${sale.paymentMethod}</div><div><strong>Status:</strong> ${sale.status}</div><div><strong>Transaction Type:</strong> ${sale.transactionType}</div>${sale.notes ? `<div><strong>Notes:</strong> ${sale.notes}</div>` : ''}<div style="margin-top: 25px; text-align: center; color: #9ca3af; font-size: 14px;">Thank you for your purchase!</div></div></div></body></html>`;

    const w = window.open('', '_blank', 'width=800,height=1100');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const exportAllCSV = () => {
    const header = ['Invoice', 'Date', 'Customer', 'Type', 'Transaction Type', 'Items Count', 'Subtotal', 'Discount', 'Total', 'Payment', 'Status', 'Notes'];
    const rows = [header];
    for (const s of sales) {
      const customer = customers.find(c => c.id === s.customerId) || {};
      rows.push([
        s.invoiceId, 
        s.date, 
        customer.name || '', 
        s.customerType || '', 
        s.transactionType || 'Walk-in',
        s.items.reduce((a, b) => a + (parseInt(b.quantity) || 0), 0), 
        s.subtotal, 
        s.discount, 
        s.total, 
        s.paymentMethod, 
        s.status, 
        s.notes || ''
      ]);
    }
    downloadCSV(`sales_export_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    pushToast('success', 'Export started');
  };

  const subtotal = calculateSubtotal(formData.items);
  const total = calculateTotal(subtotal, formData.discount);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg ${t.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : t.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {alertData.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">{alertData.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{alertData.message}</p>
              <button 
                onClick={() => setShowAlertModal(false)} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Sales Management</h1>
          <p className="text-gray-600">Track and manage water station sales</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow">
            <Plus className="w-4 h-4" /> New Sale
          </button>
          <button onClick={exportAllCSV} className="bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium shadow">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {['overview', 'sales'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Today's Sales</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(todaySales)}</p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">This Week</p>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(weekSales)}</p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-purple-900">{formatCurrency(monthSales)}</p>
                  </div>
                  <div className="bg-purple-200 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">Pending Orders</p>
                <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">Completed Orders</p>
                <p className="text-3xl font-bold text-green-600">{completedOrders}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow">
              <div className="p-6 border-b border-gray-200">
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
                    {(sales || []).slice(-5).reverse().map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoiceId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.date).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getCustomerName(sale.customerId)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{sale.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(!sales || sales.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No sales yet. Create your first sale!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by customer or invoice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All">All Types</option>
                    <option value="Regular">Regular</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Items Bought</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoiceId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.date).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getCustomerName(sale.customerId)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.customerType === 'Wholesale' ? 'bg-blue-100 text-blue-700' : sale.customerType === 'Corporate' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {sale.customerType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.deliveryType === 'Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                            {sale.deliveryType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {sale.items.map((it, i) => {
                            const ref = getItem(it.itemId) || {};
                            return (
                              <span key={i} className="block">
                                {ref.name || 'Unknown'} × {it.quantity}
                              </span>
                            );
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{sale.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openViewModal(sale)} className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100" title="View">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button onClick={() => openEditModal(sale)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Edit">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => initiateDeleteSale(sale.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSales.length === 0 && (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No sales found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Sale</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this sale? This action cannot be undone. If this sale is completed, the inventory will be restored.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={cancelDeleteSale} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium">Cancel</button>
              <button onClick={confirmDeleteSale} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Sale Modal */}
      {viewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mt-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sale {viewSale.invoiceId}</h2>
                <div className="text-sm text-gray-600">{new Date(viewSale.date).toLocaleString()} • {getCustomerName(viewSale.customerId)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printReceipt(viewSale)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                  <Download className="w-4 h-4" /> Print
                </button>
                <button onClick={closeViewModal} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Items Bought & Quantity</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewSale.items.map((it, idx) => {
                        const ref = getItem(it.itemId) || {};
                        const line = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-900">{ref.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{it.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(it.price)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(line)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(viewSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(viewSale.discount)}</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-blue-600">{formatCurrency(viewSale.total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 mb-1">Payment Method</div>
                  <div className="font-semibold text-gray-900">{viewSale.paymentMethod}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-xs font-medium text-purple-600 mb-1">Status</div>
                  <div className="font-semibold text-gray-900">{viewSale.status}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-600 mb-1">Transaction Type</div>
                  <div className="font-semibold text-gray-900">{viewSale.transactionType}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-xs font-medium text-orange-600 mb-1">Customer Type</div>
                  <div className="font-semibold text-gray-900">{viewSale.customerType}</div>
                </div>
              </div>

              {viewSale.notes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                  <div className="text-sm text-gray-600">{viewSale.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingSaleId ? 'Edit Sale' : 'New Sale'}</h2>
              <div className="flex gap-2">
                <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
                <button onClick={saveSale} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                  <Save className="w-4 h-4" /> Save Sale
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
                  <select value={formData.customerId} onChange={(e) => {
                    const selectedCustomer = customers.find(c => c.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      customerType: selectedCustomer ? selectedCustomer.type : ''
                    });
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Type</label>
                  <input
                    type="text"
                    list="customer-types"
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Select or type customer type"
                  />
                  <datalist id="customer-types">
                    {uniqueCustomerTypes.map(type => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type *</label>
                  <select value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Type</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Items *</label>
                <div className="space-y-3">
                  {formData.items.map((it, idx) => {
                    const available = getItem(it.itemId)?.currentStock ?? '-';
                    return (
                      <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_40px] gap-2 items-end">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Item</label>
                          <select value={it.itemId} onChange={(e) => updateItemRow(idx, 'itemId', e.target.value)} className="w-full px-3 py-2 border rounded bg-white">
                            <option value="">Select Item</option>
                            {Array.isArray(products) && products.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                                {p.name} {p.uom ? `— ${p.uom}` : ''}
                              </option>
                            ))}
                          </select>
                          <div className="text-xs text-gray-500 mt-1">
                            Available: <span className={available === 0 ? "text-red-600 font-bold" : ""}>{available}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max={getItem(it.itemId)?.currentStock || 1}
                            value={it.quantity}
                            onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value || 1))}
                            className="w-full px-3 py-2 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Price (Auto)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.price}
                            readOnly
                            className="w-full px-3 py-2 border rounded text-right bg-gray-100"
                          />
                        </div>
                        <div className="flex items-end">
                          {formData.items.length > 1 && (
                            <button onClick={() => removeItemRow(idx)} className="px-2 py-2 text-red-600 rounded hover:bg-red-50">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={addItemRow} className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
                  <input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value || 0) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Add any notes about this sale..." />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Discount:</span>
                    <span className="text-lg font-semibold text-red-600">-{formatCurrency(formData.discount)}</span>
                  </div>
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

