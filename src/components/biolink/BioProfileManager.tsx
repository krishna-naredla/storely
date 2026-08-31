import React, { useState, useEffect } from 'react';
import { BusinessProfile } from '../../types';
import { getBioLinks, createBioLink, updateBioLink, deleteBioLink, updateBioLinksOrder, updateBusinessProfile, getBioLinkAnalytics } from '../../services/firebaseService';
import { Plus, GripVertical, Edit2, Trash2, Link as LinkIcon, Instagram, Youtube, Facebook, Twitter, Smartphone, ExternalLink, Mail, Phone, Palette, Copy, Share2, QrCode, BarChart2, Eye, MousePointerClick } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  business: BusinessProfile;
}

const LINK_TYPES = [
  { id: 'whatsapp', label: 'WhatsApp Messenger', icon: Smartphone },
  { id: 'whatsapp_community', label: 'WhatsApp Community / Group', icon: Smartphone },
  { id: 'telegram', label: 'Telegram Channel / Group', icon: ExternalLink },
  { id: 'instagram', label: 'Instagram Profile', icon: Instagram },
  { id: 'youtube', label: 'YouTube Channel', icon: Youtube },
  { id: 'facebook', label: 'Facebook Page', icon: Facebook },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn Profile', icon: ExternalLink },
  { id: 'discord', label: 'Discord Server', icon: ExternalLink },
  { id: 'google_form', label: 'Google Form', icon: LinkIcon },
  { id: 'google_sheet', label: 'Google Sheet', icon: LinkIcon },
  { id: 'google_doc', label: 'Google Doc', icon: LinkIcon },
  { id: 'gdrive', label: 'Google Drive Link', icon: LinkIcon },
  { id: 'website', label: 'Website / Portfolio', icon: ExternalLink },
  { id: 'email', label: 'Email Address', icon: Mail },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'custom', label: 'Custom Link', icon: LinkIcon },
];

export const BioProfileManager: React.FC<Props> = ({ business }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  
  const [analytics, setAnalytics] = useState<{ views: number, clicks: number, clicksPerLink: Record<string, number> }>({
    views: 0, clicks: 0, clicksPerLink: {}
  });

  // Form states
  const [type, setType] = useState('custom');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const publicUrl = `${window.location.origin}/@${business.slug}`;

  useEffect(() => {
    loadLinks();
    QRCode.toDataURL(publicUrl, { width: 160, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(url => setQrCodeUrl(url));
  }, [business.id, publicUrl]);

  const loadLinks = async () => {
    setLoading(true);
    const [data, stats] = await Promise.all([
      getBioLinks(business.id),
      getBioLinkAnalytics(business.id)
    ]);
    setLinks(data);
    setAnalytics(stats);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
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
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setType(link.type);
    setTitle(link.title);
    setUrl(link.url);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this link?')) {
      await deleteBioLink(id);
      loadLinks();
    }
  };

  const toggleStatus = async (link: any) => {
    await updateBioLink(link.id, { enabled: !link.enabled });
    loadLinks();
  };

  // Basic array move
  const moveLink = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;
    
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;
    
    setLinks(newLinks);
    await updateBioLinksOrder(newLinks);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    // Use a non-blocking toast or simple state instead of alert
    alert('Public Link Copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Universal Bio Link</h2>
          <p className="text-slate-500 text-sm">Manage your public profile and social links.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition">
            <ExternalLink className="w-4 h-4" /> View Profile
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">My Links</h3>
              <button 
                onClick={() => {
                  setEditingLink(null);
                  setTitle('');
                  setUrl('');
                  setType('custom');
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-100 transition"
              >
                <Plus className="w-4 h-4" /> Add Link
              </button>
            </div>

            {isEditing && (
              <form onSubmit={handleSave} className="mb-6 p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Platform / Type</label>
                    <select 
                      value={type} 
                      onChange={e => setType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      required
                    >
                      {LINK_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Display Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Follow me on Instagram"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">URL</label>
                    <input 
                      type="url" 
                      value={url} 
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 rounded-lg transition">
                    {editingLink ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading links...</div>
            ) : links.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <LinkIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <h4 className="font-semibold text-slate-700">No links added</h4>
                <p className="text-sm text-slate-500 mt-1">Add your social media and community links here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link, index) => {
                  const typeData = LINK_TYPES.find(t => t.id === link.type) || LINK_TYPES[7];
                  const Icon = typeData.icon;
                  return (
                    <div key={link.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">▲</button>
                        <button onClick={() => moveLink(index, 'down')} disabled={index === links.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">▼</button>
                      </div>
                      
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{link.title}</div>
                        <div className="text-xs text-slate-500 truncate">{link.url}</div>
                      </div>
                      
                      <div className="flex flex-col items-end px-4 border-r border-slate-100 hidden sm:flex">
                        <div className="text-sm font-bold text-slate-900">{analytics.clicksPerLink[link.id] || 0}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Clicks</div>
                      </div>
                      
                      <div className="flex items-center gap-2 pl-2">
                        <button 
                          onClick={() => toggleStatus(link)}
                          className={`px-2 py-1 text-xs font-semibold rounded-md ${link.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {link.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => handleEdit(link)} className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(link.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" /> 
              Link Analytics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Profile Views</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{analytics.views}</div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <MousePointerClick className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{analytics.clicks}</div>
              </div>
            </div>
            
            {Object.keys(analytics.clicksPerLink).length > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Top Performing Link</div>
                  <div className="font-bold text-slate-900">
                    {(() => {
                      const topLinkId = Object.keys(analytics.clicksPerLink).reduce((a, b) => analytics.clicksPerLink[a] > analytics.clicksPerLink[b] ? a : b);
                      const topLink = links.find(l => l.id === topLinkId);
                      return topLink ? topLink.title : 'Unknown Link';
                    })()}
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  {Math.max(...(Object.values(analytics.clicksPerLink) as number[]))} <span className="text-sm font-medium">clicks</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <h3 className="font-bold text-lg mb-4 w-full text-left">Profile QR Code</h3>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 inline-block">
               {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />}
            </div>
            <p className="text-sm text-slate-500">Scan to view your bio link</p>
          </div>
        </div>
      </div>
    </div>
  );
};
