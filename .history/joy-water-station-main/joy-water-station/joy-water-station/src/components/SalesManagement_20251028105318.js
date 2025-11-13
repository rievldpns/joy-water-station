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

export default function SalesManagement({ 
  sales = [], 
  setSales = () => {}, 
  customers = [], 
  items = [], // Ensure items has default value
  setItems = () => {} 
}) {
  const getItem = (itemId) => {
    if (!Array.isArray(items) || !itemId) return null;
    return items.find(i => i.id === parseInt(itemId)) || null;
  };

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
            if (item.currentStock <= 0) {
              pushToast('warning', `${item.name} is out of stock`);
            }
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  return (
    <div>
      <h2>Sales Management</h2>
      <select 
        value={it.itemId} 
        onChange={(e) => updateItemRow(idx, 'itemId', e.target.value)} 
        className="w-full px-3 py-2 border rounded bg-white"
      >
        <option value="">Select Item</option>
        {Array.isArray(items) && items.map((i) => (
          <option 
            key={i.id} 
            value={i.id} 
            disabled={!i.currentStock || i.currentStock <= 0}
          >
            {i.name} {i.uom ? `— ${i.uom}` : ''} (Available: {i.currentStock || 0})
          </option>
        ))}
      </select>
    </div>
  );
}