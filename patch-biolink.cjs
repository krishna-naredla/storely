const fs = require('fs');
let code = fs.readFileSync('src/components/biolink/BioProfileManager.tsx', 'utf8');

// 1. Add isSaving state
code = code.replace(
  `  const [loading, setLoading] = useState(true);`,
  `  const [loading, setLoading] = useState(true);\n  const [isSaving, setIsSaving] = useState(false);`
);

// 2. Update handleSave
const oldHandleSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // URL Validation and Sanitization
    let safeUrl = url.trim();
    if (/^(javascript|data|file|vbs):/i.test(safeUrl)) {
      alert("Unsafe URL protocol detected. Please use http or https.");
      return;
    }
    
    if (editingLink) {
      await updateBioLink(editingLink.id, { type, title, url: safeUrl });
    } else {
      await createBioLink(business.id, {
        type,
        title,
        url: safeUrl,
        enabled: true,
        order: links.length
      });
    }
    setIsEditing(false);
    setEditingLink(null);
    setTitle('');
    setUrl('');
    setType('custom');
    loadLinks();
  };`;

const newHandleSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    // URL Validation and Sanitization
    let safeUrl = url.trim();
    if (/^(javascript|data|file|vbs):/i.test(safeUrl)) {
      alert("Unsafe URL protocol detected. Please use http or https.");
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingLink) {
        await updateBioLink(editingLink.id, { type, title, url: safeUrl });
      } else {
        await createBioLink(business.id, {
          type,
          title,
          url: safeUrl,
          enabled: true,
          order: links.length
        });
      }
      setIsEditing(false);
      setEditingLink(null);
      setTitle('');
      setUrl('');
      setType('custom');
      await loadLinks();
    } finally {
      setIsSaving(false);
    }
  };`;

code = code.replace(oldHandleSave, newHandleSave);

// 3. Disable submit button
code = code.replace(
  `<button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-6 transition">
              {editingLink ? 'Update Link' : 'Add Link'}
            </button>`,
  `<button type="submit" disabled={isSaving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl mt-6 transition">
              {isSaving ? 'Saving...' : (editingLink ? 'Update Link' : 'Add Link')}
            </button>`
);

fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', code);
console.log('patched BioProfileManager.tsx');
