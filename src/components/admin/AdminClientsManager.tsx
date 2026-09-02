import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Star,
  Check,
  CheckCircle2,
  X,
  RotateCcw,
  Eye,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  TrendingUp,
} from 'lucide-react';
import { PlatformClientBrand } from '../../types/admin';
import {
  adminGetHappyClients,
  adminSaveHappyClient,
  adminDeleteHappyClient,
  adminReorderHappyClients,
  adminResetHappyClientsToDefaults,
  DEFAULT_HAPPY_CLIENTS,
} from '../../services/adminService';

interface AdminClientsManagerProps {
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const PRESET_LOGOS = [
  { name: 'Fashion & Handloom', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=150&auto=format&fit=crop&q=80' },
  { name: 'Coffee & Spices', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80' },
  { name: 'Tech & Academy', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80' },
  { name: 'Home & Living', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=150&auto=format&fit=crop&q=80' },
  { name: 'Organic Grocery', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80' },
  { name: 'Bakery & Desserts', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80' },
  { name: 'Fitness & Coach', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80' },
  { name: 'Skincare & Beauty', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Jewellery & Gems', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=150&auto=format&fit=crop&q=80' },
  { name: 'Restaurant & Cafe', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80' },
];

export const AdminClientsManager: React.FC<AdminClientsManagerProps> = ({ onNotify }) => {
  const [clients, setClients] = useState<PlatformClientBrand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [form, setForm] = useState<PlatformClientBrand>({
    id: '',
    name: '',
    category: 'Fashion Boutique',
    logoUrl: PRESET_LOGOS[0].url,
    storeUrl: 'https://storelly.com/my-store',
    tagline: 'Delivering exceptional craft and products across India',
    rating: 5.0,
    highlightMetric: '₹12.5L Monthly GMV',
    isActive: true,
    order: 1,
    createdAt: Date.now(),
  });

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onNotify) onNotify(msg, type);
    else console.log(`[Clients Admin] ${msg}`);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await adminGetHappyClients();
      setClients(list);
    } catch (err) {
      console.error('Error loading clients list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleClientsChange = () => loadData();
    window.addEventListener('storelly_clients_changed', handleClientsChange);
    return () => window.removeEventListener('storelly_clients_changed', handleClientsChange);
  }, []);

  const handleOpenAdd = () => {
    setEditingClientId(null);
    setForm({
      id: 'client_' + Date.now(),
      name: 'Artisan Craft Studio',
      category: 'Handmade Crafts & Gifts',
      logoUrl: PRESET_LOGOS[3].url,
      storeUrl: 'https://storelly.com/artisan-craft',
      tagline: 'Custom pottery, resin art and personalized gifts',
      rating: 4.9,
      highlightMetric: '750+ WhatsApp Orders',
      isActive: true,
      order: clients.length + 1,
      createdAt: Date.now(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: PlatformClientBrand) => {
    setEditingClientId(client.id);
    setForm({ ...client });
    setIsModalOpen(true);
  };

  const handleDelete = async (client: PlatformClientBrand) => {
    if (clients.length <= 1) {
      alert('You must keep at least 1 client brand in the carousel.');
      return;
    }
    const confirmed = window.confirm(`Remove "${client.name}" from Happy Clients carousel?`);
    if (!confirmed) return;

    await adminDeleteHappyClient(client.id);
    notify(`Client brand "${client.name}" deleted from system_settings.`);
    loadData();
  };

  const handleToggleActive = async (client: PlatformClientBrand) => {
    const updated = { ...client, isActive: !client.isActive };
    await adminSaveHappyClient(updated);
    notify(`Updated visibility for "${client.name}".`);
    loadData();
  };

  const handleMoveOrder = async (clientId: string, direction: 'up' | 'down') => {
    const index = clients.findIndex((c) => c.id === clientId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === clients.length - 1) return;

    const newClients = [...clients];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newClients[index];
    newClients[index] = newClients[targetIdx];
    newClients[targetIdx] = temp;

    setClients(newClients);
    await adminReorderHappyClients(newClients);
    notify('Carousel brand order updated.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Client brand name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await adminSaveHappyClient(form);
      notify(`Client brand "${form.name}" saved to system_settings/clients_carousel!`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save client brand:', err);
      alert('Error saving client brand.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const confirmed = window.confirm(
      'Reset all Happy Clients & Brands to the official Storelly curated list?'
    );
    if (!confirmed) return;

    const list = await adminResetHappyClientsToDefaults();
    setClients(list);
    notify('Happy clients carousel reset to default verified brands.');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading Happy Clients & Brands Carousel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Our Happy Clients & Brands (Marquee Strip)</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              system_settings/clients_carousel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            Manage the scrolling logo marquee displayed prominently on the Storelly landing page. Add high-growth brands,
            upload custom logos, set highlight metrics (e.g. GMV or WhatsApp orders), and reorder items seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Curated Defaults
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Happy Client
          </button>
        </div>
      </div>

      {/* Grid of Client Brands */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clients.map((client, index) => (
          <div
            key={client.id}
            className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between relative transition-all duration-200 ${
              client.isActive
                ? 'border-slate-200 hover:border-emerald-300'
                : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            {/* Top controls */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  client.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {client.isActive ? 'Active on Marquee' : 'Hidden'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveOrder(client.id, 'up')}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                  title="Move Left"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={index === clients.length - 1}
                  onClick={() => handleMoveOrder(client.id, 'down')}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                  title="Move Right"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Logo and Brand Name */}
            <div className="flex items-center gap-3.5 mb-3">
              <img
                src={client.logoUrl}
                alt={client.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">{client.name}</h4>
                <p className="text-[11px] text-emerald-700 font-semibold truncate">{client.category}</p>
              </div>
            </div>

            {/* Metrics and rating */}
            <div className="space-y-1.5 py-2 border-t border-slate-100 text-[11px] text-slate-600">
              {client.highlightMetric && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Growth Metric:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {client.highlightMetric}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rating:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {client.rating || 5.0} / 5.0
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(client)}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>

              <button
                type="button"
                onClick={() => handleToggleActive(client)}
                className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  client.isActive
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
                title={client.isActive ? 'Hide from Marquee' : 'Show on Marquee'}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(client)}
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Delete Brand"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FOR ADD / EDIT BRAND */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingClientId ? `Edit Client: ${form.name}` : 'Add Happy Client Brand'}
                  </h3>
                  <p className="text-xs text-slate-500">Add verified logo, store link, and growth metrics.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Store Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Vogue Loom Threads"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category / Industry</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Handloom & Fashion Boutique"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Highlight Metric</label>
                  <input
                    type="text"
                    value={form.highlightMetric || ''}
                    onChange={(e) => setForm({ ...form, highlightMetric: e.target.value })}
                    placeholder="e.g. ₹14.2L Monthly GMV"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logo Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <img
                    src={form.logoUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as any).src = PRESET_LOGOS[0].url;
                    }}
                  />
                </div>

                {/* Quick select presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Or select a curated category logo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOGOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, logoUrl: p.url, category: p.name })}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.rating || 5.0}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store / Web URL</label>
                  <input
                    type="text"
                    value={form.storeUrl || ''}
                    onChange={(e) => setForm({ ...form, storeUrl: e.target.value })}
                    placeholder="https://storelly.com/brand"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Text / Testimonial</label>
                <textarea
                  value={form.reviewText || ''}
                  onChange={(e) => setForm({ ...form, reviewText: e.target.value })}
                  placeholder="e.g. 'Storelly completely transformed how we sell online!'"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Author Name (Optional)</label>
                <input
                  type="text"
                  value={form.reviewAuthor || ''}
                  onChange={(e) => setForm({ ...form, reviewAuthor: e.target.value })}
                  placeholder="e.g. Jane Doe, Founder"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 pt-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                Active on Landing Page Scrolling Marquee
              </label>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingClientId ? 'Update Client' : 'Add to Marquee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
