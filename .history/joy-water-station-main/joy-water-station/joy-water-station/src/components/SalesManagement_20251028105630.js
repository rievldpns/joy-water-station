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

// Add initial items state
const initialItems = [
  { id: 1, name: 'Water Gallon', price: 35, currentStock: 100, uom: 'pc' },
  { id: 2, name: 'Water Container', price: 150, currentStock: 50, uom: 'pc' },
];

export default function SalesManagement({ 
  sales = [], 
  setSales = () => {}, 
  customers = [], 
  items = initialItems, 
  setItems = () => {} 
}) {
  const [formData, setFormData] = useState({ items: [] });

  // Update getItem with proper null checks
  const getItem = (itemId) => {
    if (!itemId || !Array.isArray(items)) return null;
    const item = items.find(i => i.id === parseInt(itemId));
    return item || null;
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
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  // Add items initialization
  useEffect(() => {
    if (!items || items.length === 0) {
      setItems(initialItems);
    }
  }, [items, setItems]);

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
              disabled={!Array.isArray(items) || items.length === 0}
            >
              <option value="">Select Item</option>
              {(items || []).map((i) => (
                <option 
                  key={i.id} 
                  value={i.id} 
                  disabled={String(!i.currentStock || i.currentStock <= 0)} // Fix boolean attribute
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