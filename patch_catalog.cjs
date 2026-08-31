const fs = require('fs');
const file = 'src/components/dashboard/CatalogManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add state
const statePattern = "const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');";
const stateReplacement = statePattern + `
  // Bulk Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
`;
code = code.replace(statePattern, stateReplacement);

// Add bulk actions
const handleToggleActivePattern = "const handleToggleActive = async (item: CatalogItem) => {";
const bulkActions = `
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    if (!window.confirm(\`Are you sure you want to delete \${selectedItemIds.size} items?\`)) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedItemIds) {
        await deleteCatalogItem(business.id, id);
      }
      setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
      setSelectedItemIds(new Set());
    } catch (err) {
      console.error('Error in bulk delete:', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkToggleVisibility = async (isActive: boolean) => {
    if (selectedItemIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedItemIds) {
        await updateCatalogItem(business.id, id, { isActive });
      }
      setItems(prev => prev.map(i => selectedItemIds.has(i.id) ? { ...i, isActive } : i));
      setSelectedItemIds(new Set());
    } catch (err) {
      console.error('Error in bulk visibility toggle:', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

`;
code = code.replace(handleToggleActivePattern, bulkActions + handleToggleActivePattern);

// Add bulk action bar above the list
const listHeaderPattern = `{/* Item List / Grid */}`;
const bulkActionBar = `
      {selectedItemIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-800">
            {selectedItemIds.size} item{selectedItemIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkToggleVisibility(true)}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              Show
            </button>
            <button
              onClick={() => handleBulkToggleVisibility(false)}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              Hide
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
`;
code = code.replace(listHeaderPattern, bulkActionBar + listHeaderPattern);

// Checkbox and Low Stock Badge
// We need to inject the checkbox next to the image in the list, and a Select All checkbox in the header.
// Actually, let's just put the checkbox in the item card.
const cardStartPattern = 'className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 relative shadow-2xs hover:shadow-md';
const cardCheckbox = `
                <div className="absolute top-3 left-3 z-20">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => handleToggleSelectItem(item.id)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
`;
if (code.includes(cardStartPattern)) {
    code = code.replace(cardStartPattern, cardCheckbox + cardStartPattern);
}

// Low Stock Badge
// Locate where it renders badges:
const badgePattern = '{item.isFeatured && (';
const lowStockBadge = `
                        {(item.stockQuantity !== undefined && item.stockQuantity < 5 && item.type === 'product' && item.inStock) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Low Stock ({item.stockQuantity})
                          </span>
                        )}
`;
if (code.includes(badgePattern)) {
    code = code.replace(badgePattern, lowStockBadge + badgePattern);
}

// Select All near the search/filter
const filterPattern = '<Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />';
const selectAllCheckbox = `
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="selectAll"
            checked={filteredItems.length > 0 && selectedItemIds.size === filteredItems.length}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="selectAll" className="text-sm text-slate-600 font-medium">Select All</label>
        </div>
`;
code = code.replace(filterPattern, selectAllCheckbox + filterPattern);

fs.writeFileSync(file, code);
