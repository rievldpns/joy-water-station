import React, { useState, useEffect } from 'react';
import {
  Plus, Search, TrendingUp, DollarSign, ShoppingCart, Edit2, Trash2, Eye, Download, X, Save
} from 'lucide-react';

/**
 * SalesManagement.js
 * Enhanced sales management:
 * - Add/Edit sale modal (totals, notes)
 * - View (receipt) modal + print
 * - Export CSV
 * - Toasts
 * - Inventory auto-update (requires setItems prop)
 *
 * Props:
 * - sales, setSales
 * - customers
 * - items, setItems
 */

const initialSales = [];

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

export default function SalesManagement({ sales, setSales, customers = [], items = [], setItems }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  const [viewSale, setViewSale] = useState(null);

  const [editingSaleId, setEditingSaleId] = useState(null);

  const [toasts, setToasts] = useState([]);

  const [formData, setFormData] = useState({
    customerId: '',
    customerType: 'Regular',
    items: [{ itemId: '', quantity: 1, price: 0 }],
    discount: 0,
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: ''
  });

  // Initialize sales if empty
  useEffect(() => {
    if (!sales || sales.length === 0) {
      setSales(initialSales);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast helpers
  const pushToast = (type, text, ttl = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
  };

  // Calculations
  const calculateSubtotal = (saleItems) => {
    return saleItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  };

  const calculateTotal = (subtotal, discount) => {
    return subtotal - (parseFloat(discount) || 0);
  };

  // Helpers
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    return customer ? customer.name : 'Unknown Customer';
  };

  const getItem = (itemId) => {
    return items.find(i => i.id === parseInt(itemId));
  };

  // Stats (today/week/month)
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = (sales || [])
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + (s.total || 0), 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekSales = (sales || [])
    .filter(s => new Date(s.date) >= weekStart)
    .reduce((sum, s) => sum + (s.total || 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthSales = (sales || [])
    .filter(s => new Date(s.date) >= monthStart)
    .reduce((sum, s) => sum + (s.total || 0), 0);

  const totalOrders = (sales || []).length;
  const pendingOrders = (sales || []).filter(s => s.status === 'Pending').length;
  const completedOrders = (sales || []).filter(s => s.status === 'Completed').length;

  // Filtering
  const filteredSales = (sales || []).filter(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const matchesSearch = (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sale.status === filterStatus;
    const matchesType = filterType === 'All' || sale.customerType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Modal controls
  const openAddModal = () => {
    setEditingSaleId(null);
    setFormData({
      customerId: '',
      customerType: 'Regular',
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
    // deep clone items
    const clonedItems = sale.items.map(it => ({ ...it }));
    setFormData({
      customerId: sale.customerId.toString(),
      customerType: sale.customerType,
      items: clonedItems,
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

  const addItemRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { itemId: '', quantity: 1, price: 0 }] }));
  };

  const removeItemRow = (index) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };

  const updateItemRow = (index, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map((it, i) => i === index ? { ...it } : it);
      newItems[index][field] = value;
      // autofill price if itemId chosen
      if (field === 'itemId' && value) {
        const item = getItem(value);
        if (item) newItems[index].price = item.price;
      }
      return { ...prev, items: newItems };
    });
  };

  // Inventory helpers: check & apply stock changes
  const canApplyStockChange = (saleItems, currentItemsState) => {
    // saleItems: [{itemId, quantity}]
    for (const sItem of saleItems) {
      const itemRef = currentItemsState.find(i => i.id === parseInt(sItem.itemId));
      const qtyNeeded = parseInt(sItem.quantity) || 0;
      if (!itemRef) return { ok: false, missing: true, id: sItem.itemId };
      if (itemRef.currentStock < qtyNeeded) {
        return { ok: false, insufficient: true, id: sItem.itemId, available: itemRef.currentStock, needed: qtyNeeded };
      }
    }
    return { ok: true };
  };

  const applyStockChange = (saleItems, deltaSign = -1) => {
    // deltaSign: -1 to deduct, +1 to add back
    if (!setItems) return; // if no setItems provided, skip
    setItems(prevItems => {
      const next = prevItems.map(it => ({ ...it }));
      for (const sItem of saleItems) {
        const idx = next.findIndex(i => i.id === parseInt(sItem.itemId));
        if (idx === -1) continue;
        const change = (parseInt(sItem.quantity) || 0) * deltaSign;
        next[idx].currentStock = Math.max(0, (parseInt(next[idx].currentStock) || 0) + change);
      }
      return next;
    });
  };

  // Save sale (create or update) with inventory handling
  const saveSale = () => {
    // validation
    if (!formData.customerId || formData.items.length === 0 || !formData.items[0].itemId) {
      alert('Please fill required fields: Customer and at least one item');
      return;
    }

    // build sale data
    const subtotal = calculateSubtotal(formData.items);
    const discount = parseFloat(formData.discount) || 0;
    const total = calculateTotal(subtotal, discount);
    const currentDate = new Date().toISOString().split('T')[0];

    // Determine stock operations:
    // If editing an existing sale that was Completed, we must revert its prior deduction first.
    let previousSale = null;
    if (editingSaleId) {
      previousSale = sales.find(s => s.id === editingSaleId) || null;
    }

    // Prepare working items (read from current items state)
    const currentItemsState = items.map(it => ({ ...it }));

    // If previousSale existed and had status Completed, revert its effect before testing
    if (previousSale && previousSale.status === 'Completed') {
      // revert by adding back old quantities
      for (const sItem of previousSale.items) {
        const itemRef = currentItemsState.find(i => i.id === parseInt(sItem.itemId));
        if (itemRef) {
          itemRef.currentStock = (parseInt(itemRef.currentStock) || 0) + (parseInt(sItem.quantity) || 0);
        }
      }
    }

    // If new status will be Completed, test whether enough stock exists for new sale items
    if (formData.status === 'Completed') {
      const check = canApplyStockChange(formData.items, currentItemsState);
      if (!check.ok) {
        if (check.missing) {
          alert('One or more items no longer exist in inventory.');
        } else if (check.insufficient) {
          const itemInfo = getItem(check.id);
          alert(`Insufficient stock for "${itemInfo?.name || 'Unknown'}". Available: ${check.available}, Needed: ${check.needed}`);
        } else {
          alert('Unable to apply stock changes. Check inventory.');
        }
        return;
      }
    }

    // At this point, all checks passed. Apply create or update.
    if (editingSaleId) {
      // Update existing
      setSales(prev => prev.map(s =>
        s.id === editingSaleId
          ? {
            ...s,
            customerId: parseInt(formData.customerId),
            customerType: formData.customerType,
            items: formData.items.map(it => ({ ...it, quantity: parseInt(it.quantity), price: parseFloat(it.price) })),
            subtotal,
            discount,
            total,
            paymentMethod: formData.paymentMethod,
            status: formData.status,
            notes: formData.notes
          }
          : s
      ));

      // handle inventory: if previous was completed and new is not completed, we already reverted above (no further action).
      // if previous was not completed and new is completed -> deduct
      if (previousSale && previousSale.status !== 'Completed' && formData.status === 'Completed') {
        applyStockChange(formData.items, -1);
      }

      // if previous was completed and new is completed -> we reverted old then deduct new
      if (previousSale && previousSale.status === 'Completed' && formData.status === 'Completed') {
        applyStockChange(formData.items, -1);
      }

      pushToast('success', 'Sale updated successfully');
    } else {
      // Create new sale
      const newId = (sales && sales.length > 0) ? Math.max(...sales.map(s => s.id)) + 1 : 1;
      const invoiceId = `INV-${String(newId).padStart(4, '0')}`;
      const newSale = {
        id: newId,
        invoiceId,
        date: currentDate,
        customerId: parseInt(formData.customerId),
        customerType: formData.customerType,
        items: formData.items.map(it => ({ ...it, quantity: parseInt(it.quantity), price: parseFloat(it.price) })),
        subtotal,
        discount,
        total,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes
      };
      setSales(prev => [...prev, newSale]);

      // Deduct stock immediately if Completed
      if (formData.status === 'Completed') {
        applyStockChange(formData.items, -1);
      }

      pushToast('success', 'Sale created successfully');
    }

    closeModal();
  };

  const initiateDeleteSale = (id) => {
    setSaleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = () => {
    if (saleToDelete) {
      // If sale being deleted was Completed -> add back stock
      const toDelete = sales.find(s => s.id === saleToDelete);
      if (toDelete && toDelete.status === 'Completed') {
        applyStockChange(toDelete.items, +1);
      }
      setSales(prev => prev.filter(s => s.id !== saleToDelete));
      pushToast('success', 'Sale deleted');
    }
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  const cancelDeleteSale = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  // View sale (receipt) printing
  const openViewModal = (sale) => {
    setViewSale(sale);
  };

  const closeViewModal = () => {
    setViewSale(null);
  };

  const printReceipt = (sale) => {
    // Build printable HTML
    const customer = customers.find(c => c.id === sale.customerId) || {};
    const itemsHtml = sale.items.map(it => {
      const itemRef = getItem(it.itemId) || {};
      const lineTotal = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0);
      return `<tr>
        <td style="padding:6px">${itemRef.name || 'Unknown'}</td>
        <td style="padding:6px; text-align:center">${it.quantity}</td>
        <td style="padding:6px; text-align:right">${formatCurrency(it.price)}</td>
        <td style="padding:6px; text-align:right">${formatCurrency(lineTotal)}</td>
      </tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Receipt ${sale.invoiceId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
            table { width:100%; border-collapse: collapse; margin-top:12px; }
            th { text-align:left; padding:6px; border-bottom:1px solid #ddd; }
            td { border-bottom: 1px solid #f0f0f0; }
            .totals td { border-top:1px solid #ddd; font-weight:700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>Joy Water Station</h2>
              <div>${customer.name || ''}</div>
              <div>${customer.phone || ''}</div>
            </div>
            <div>
              <div>Invoice: <strong>${sale.invoiceId}</strong></div>
              <div>Date: ${sale.date}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr class="totals"><td></td><td></td><td style="text-align:right">Subtotal</td><td style="text-align:right">${formatCurrency(sale.subtotal)}</td></tr>
              <tr class="totals"><td></td><td></td><td style="text-align:right">Discount</td><td style="text-align:right">${formatCurrency(sale.discount)}</td></tr>
              <tr class="totals"><td></td><td></td><td style="text-align:right">Total</td><td style="text-align:right">${formatCurrency(sale.total)}</td></tr>
            </tfoot>
          </table>

          <div style="margin-top:18px;">
            <div>Payment: ${sale.paymentMethod}</div>
            <div>Status: ${sale.status}</div>
            <div style="margin-top:8px;">Notes: ${sale.notes || ''}</div>
          </div>
        </body>
      </html>
    `;

    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(html);
    w.document.close();
    // give some time for render then print
    setTimeout(() => {
      w.print();
    }, 300);
  };

  // Export CSV (all sales)
  const exportAllCSV = () => {
    const header = ['Invoice', 'Date', 'Customer', 'Type', 'ItemsCount', 'Subtotal', 'Discount', 'Total', 'Payment', 'Status', 'Notes'];
    const rows = [header];
    for (const s of sales) {
      const customer = customers.find(c => c.id === s.customerId) || {};
      rows.push([
        s.invoiceId,
        s.date,
        customer.name || '',
        s.customerType || '',
        s.items.reduce((a, b) => a + (parseInt(b.quantity) || 0), 0),
        s.subtotal,
        s.discount,
        s.total,
        s.paymentMethod,
        s.status,
        s.notes || ''
      ]);
    }
    downloadCSV(`sales_export_${new Date().toISOString().slice(0,10)}.csv`, rows);
    pushToast('success', 'Export started');
  };

  return (
    <div className="p-6">
      {/* Toaster */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow ${t.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Sale</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this sale? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={cancelDeleteSale} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDeleteSale} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Sale Modal */}
      {viewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mt-8">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Sale {viewSale.invoiceId}</h2>
                <div className="text-sm text-gray-600">{viewSale.date} • {getCustomerName(viewSale.customerId)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printReceipt(viewSale)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Print / Download
                </button>
                <button onClick={closeViewModal} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium">Items</h3>
                <div className="mt-2">
                  <table className="w-full">
                    <thead className="text-xs text-gray-500">
                      <tr>
                        <th className="text-left">Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewSale.items.map((it, idx) => {
                        const ref = getItem(it.itemId) || {};
                        const line = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0);
                        return (
                          <tr key={idx} className="border-b">
                            <td className="py-2">{ref.name || 'Unknown'}</td>
                            <td className="py-2 text-center">{it.quantity}</td>
                            <td className="py-2 text-right">{formatCurrency(it.price)}</td>
                            <td className="py-2 text-right">{formatCurrency(line)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td></td><td></td><td className="text-right font-medium">Subtotal</td>
                        <td className="text-right font-medium">{formatCurrency(viewSale.subtotal)}</td>
                      </tr>
                      <tr>
                        <td></td><td></td><td className="text-right">Discount</td>
                        <td className="text-right">{formatCurrency(viewSale.discount)}</td>
                      </tr>
                      <tr>
                        <td></td><td></td><td className="text-right font-bold">Total</td>
                        <td className="text-right font-bold">{formatCurrency(viewSale.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Payment</div>
                  <div className="font-medium">{viewSale.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium">{viewSale.status}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Notes</div>
                <div className="text-sm">{viewSale.notes || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sales Management</h1>
          <p className="text-gray-600">Track and manage water station sales</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Sale
          </button>
          <button onClick={exportAllCSV} className="bg-white border px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {['overview', 'sales'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
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
              <div className="bg-white p-6 rounded-xl border">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <p className="text-sm font-medium text-gray-600 mb-1">Completed Orders</p>
                <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl border">
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
                    {(sales || []).slice(-5).reverse().map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoiceId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.date}</td>
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
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by customer or invoice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="flex gap-3">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="All">All Types</option>
                    <option value="Regular">Regular</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
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
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoiceId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getCustomerName(sale.customerId)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.customerType === 'Wholesale' ? 'bg-blue-100 text-blue-700' : sale.customerType === 'Corporate' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {sale.customerType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.items.reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0)} items</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{sale.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{sale.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openViewModal(sale)} className="text-gray-600 hover:text-gray-900" title="View">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button onClick={() => openEditModal(sale)} className="text-blue-600 hover:text-blue-900" title="Edit">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => initiateDeleteSale(sale.id)} className="text-red-600 hover:text-red-900" title="Delete">
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingSaleId ? 'Edit Sale' : 'New Sale'}</h2>
              <div className="flex gap-2">
                <button onClick={closeModal} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button onClick={saveSale} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Sale
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <select value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select Customer</option>
                    {customers.filter(c => !c.hidden).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                  <select value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="Regular">Regular</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_110px_auto] gap-2 items-start md:items-center">
                      {/* Item select (flexible) */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Item</label>
                        <select
                          value={it.itemId}
                          onChange={(e) => updateItemRow(idx, 'itemId', e.target.value)}
                          className="w-full px-3 py-2 border rounded bg-white"
                        >
                          <option value="">Select Item</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name}{i.uom ? ` — ${i.uom}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (fixed width) */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value || 1))}
                          className="w-full px-3 py-2 border rounded text-center"
                        />
                      </div>

                      {/* Price (fixed width) */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.price}
                          onChange={(e) => updateItemRow(idx, 'price', parseFloat(e.target.value || 0))}
                          className="w-full px-3 py-2 border rounded text-right"
                        />
                      </div>

                      {/* Remove button */}
                      <div className="flex items-center">
                        {formData.items.length > 1 && (
                          <button
                            onClick={() => removeItemRow(idx)}
                            className="px-2 py-2 text-red-600 rounded hover:bg-red-50"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button onClick={addItemRow} className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                  <input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded">
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded border">
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-600">Subtotal</div>
                  <div className="font-medium">{formatCurrency(calculateSubtotal(formData.items))}</div>
                </div>
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-600">Discount</div>
                  <div className="font-medium">{formatCurrency(parseFloat(formData.discount) || 0)}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm text-gray-700">Total</div>
                  <div className="font-bold text-lg">{formatCurrency(calculateTotal(calculateSubtotal(formData.items), formData.discount))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
