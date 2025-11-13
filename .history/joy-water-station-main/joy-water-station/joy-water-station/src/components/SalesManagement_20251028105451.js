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
  items = [], // Add default empty array
  setItems = () => {} 
}) {
  const getItem = (itemId) => {
    if (!Array.isArray(items) || !itemId) return null;
    return items.find(i => i.id === parseInt(itemId)) || null;
  };

  const updateItemRow = (index, field, value) => {
    if (!Array.isArray(items)) return;
    setFormData(prev => {
      const newItems = prev.items.map((it, i) => {
        if (i !== index) return it;
        let updated = { ...it, [field]: value };
        if (field === 'itemId' && value) {
          const item = getItem(value);
          if (item) {
            updated.price = item.price || 0;
            updated.quantity = Math.min(1, item.currentStock || 0);
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  return (
    <div className="space-y-3">
      {formData.items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_40px] gap-2 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Item</label>
            <select 
              value={it.itemId || ''} 
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
          {/* ...rest of the item form... */}
        </div>
      ))}
    </div>
  );
}