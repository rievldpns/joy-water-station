exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    next();
  };
};

// Add initial products data
const initialProducts = [
  { 
    id: 1, 
    name: 'Water Gallon', 
    price: 35.00, 
    currentStock: 100,
    uom: 'pc'
  },
  { 
    id: 2, 
    name: 'Water Container', 
    price: 150.00, 
    currentStock: 50,
    uom: 'pc'
  }
];

export default function SalesManagement({ 
  sales = [], 
  setSales = () => {}, 
  customers = [], 
  items = initialProducts, // Use initialProducts as default
  setItems = () => {},
  products = initialProducts, // Use initialProducts as default
  setProducts = () => {} 
}) {
  const [formData, setFormData] = useState({ items: [] });

  // Update getItem function to handle both items and products
  const getItem = (itemId) => {
    if (!itemId) return null;
    return (products || items || []).find(i => i.id === parseInt(itemId)) || null;
  };

  // Update updateItemRow with better inventory checks
  const updateItemRow = (index, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map((it, i) => {
        if (i !== index) return it;
        let updated = { ...it, [field]: value };
        
        if (field === 'itemId' && value) {
          const item = getItem(value);
          if (item) {
            updated.price = item.price || 0;
            updated.quantity = 1;
            
            // Show inventory warning if stock is low
            if (item.currentStock <= (item.minStock || 5)) {
              pushToast('warning', `Low stock alert: ${item.name} has only ${item.currentStock} units left`);
            }
          }
        }

        if (field === 'quantity') {
          const item = getItem(it.itemId);
          if (item) {
            const newQty = parseInt(value) || 0;
            if (newQty > item.currentStock) {
              pushToast('error', `Only ${item.currentStock} units available for ${item.name}`);
              updated.quantity = item.currentStock;
            } else if (newQty < 1) {
              updated.quantity = 1;
            } else {
              updated.quantity = newQty;
            }
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  // Update saveSale to handle inventory
  const saveSale = async () => {
    // Validate required fields
    if (!formData.customerId || formData.items.length === 0 || !formData.items[0].itemId) {
      pushToast('error', 'Please fill required fields: Customer and at least one item');
      return;
    }

    // Validate stock availability
    for (const item of formData.items) {
      const inventoryItem = getItem(item.itemId);
      if (!inventoryItem) {
        pushToast('error', 'One or more items not found in inventory');
        return;
      }
      if (item.quantity > inventoryItem.currentStock) {
        pushToast('error', `Insufficient stock for ${inventoryItem.name}`);
        return;
      }
    }

    try {
      // Prepare sale data
      const saleData = {
        // ...existing sale data preparation...
      };

      if (formData.status === 'Completed') {
        // Update inventory immediately for completed sales
        const updatedProducts = products.map(product => {
          const saleItem = formData.items.find(item => parseInt(item.itemId) === product.id);
          if (saleItem) {
            return {
              ...product,
              currentStock: product.currentStock - parseInt(saleItem.quantity)
            };
          }
          return product;
        });
        setProducts(updatedProducts);
      }

      // Update sales state
      if (editingSaleId) {
        setSales(prev => prev.map(sale => 
          sale.id === editingSaleId ? saleData : sale
        ));
      } else {
        setSales(prev => [...prev, saleData]);
      }

      pushToast('success', `Sale ${editingSaleId ? 'updated' : 'created'} successfully`);
      closeModal();
    } catch (error) {
      pushToast('error', error.message);
    }
  };

  // Add inventory restoration on delete
  const confirmDeleteSale = () => {
    if (saleToDelete) {
      const sale = sales.find(s => s.id === saleToDelete);
      if (sale && sale.status === 'Completed') {
        // Restore inventory quantities
        const updatedProducts = products.map(product => {
          const saleItem = sale.items.find(item => parseInt(item.itemId) === product.id);
          if (saleItem) {
            return {
              ...product,
              currentStock: product.currentStock + parseInt(saleItem.quantity)
            };
          }
          return product;
        });
        setProducts(updatedProducts);
      }
      
      setSales(prev => prev.filter(s => s.id !== saleToDelete));
      pushToast('success', 'Sale deleted successfully');
    }
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  // Add useEffect to initialize products if empty
  useEffect(() => {
    if (!products || products.length === 0) {
      setProducts(initialProducts);
    }
  }, [products, setProducts]);

  return (
    <div className="space-y-3">
      {formData.items.map((it, idx) => (
        <div key={idx}>
          {/* Update item selection in modal */}
          <select 
            value={it.itemId} 
            onChange={(e) => updateItemRow(idx, 'itemId', e.target.value)} 
            className="w-full px-3 py-2 border rounded bg-white"
          >
            <option value="">Select Item</option>
            {(products || items || []).map((item) => (
              <option 
                key={item.id} 
                value={item.id} 
                disabled={item.currentStock <= 0}
              >
                {item.name} ({item.currentStock} available)
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}