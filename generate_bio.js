import fs from 'fs';

const managerCode = `import React, { useState, useEffect } from 'react';
import { BusinessProfile } from '../../types';
import { getBioLinks, createBioLink, updateBioLink, deleteBioLink, updateBioLinksOrder, updateBusinessProfile, getBioLinkAnalytics, getBioLinkUrl } from '../../services/firebaseService';
import { Plus, GripVertical, Edit2, Trash2, Link as LinkIcon, Instagram, Youtube, Facebook, Twitter, Smartphone, ExternalLink, Mail, Phone, Palette, Copy, Share2, QrCode, BarChart2, Eye, MousePointerClick, MessageCircle, Send, Linkedin, MessageSquare, FileText, Folder, Globe, Briefcase, ShoppingBag, Layout } from 'lucide-react';
import QRCode from 'qrcode';
import { SafeImage } from '../common/SafeImage';

interface Props {
  business: BusinessProfile;
}

const LINK_TYPES = [
  { id: 'whatsapp', label: 'WhatsApp Messenger', icon: MessageCircle },
  { id: 'telegram', label: 'Telegram Channel', icon: Send },
  { id: 'instagram', label: 'Instagram Profile', icon: Instagram },
  { id: 'youtube', label: 'YouTube Channel', icon: Youtube },
  { id: 'facebook', label: 'Facebook Page', icon: Facebook },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn Profile', icon: Linkedin },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'digital_store', label: 'Digital Store', icon: ShoppingBag },
  { id: 'website', label: 'Website / Other', icon: Globe },
  { id: 'email', label: 'Email Address', icon: Mail },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'custom', label: 'Custom Link', icon: LinkIcon },
];

export const BioProfileManager: React.FC<Props> = ({ business }) => {
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>('links');
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Link Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [type, setType] = useState('custom');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  
  // Appearance State
  const [theme, setTheme] = useState(business.bioTheme || {
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    buttonStyle: 'rounded', // rounded, pill, square
    buttonColor: '#ffffff',
    buttonTextColor: '#0f172a',
    fontFamily: 'Inter, sans-serif'
  });
  
  const [analytics, setAnalytics] = useState({ views: 0, clicks: 0, clicksPerLink: {} });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const publicUrl = getBioLinkUrl(business.slug);

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
    setLinks(data.sort((a,b) => (a.order || 0) - (b.order || 0)));
    setAnalytics(stats as any);
    setLoading(false);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    let safeUrl = url.trim();
    if (!/^https?:\\/\\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
    
    setIsSaving(true);
    try {
      if (editingLink) {
        await updateBioLink(editingLink.id, { type, title, url: safeUrl });
      } else {
        await createBioLink(business.id, { type, title, url: safeUrl, enabled: true, order: links.length });
      }
      setIsEditing(false);
      setEditingLink(null);
      setTitle(''); setUrl(''); setType('custom');
      await loadLinks();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await deleteBioLink(id);
    await loadLinks();
  };

  const toggleLink = async (id: string, current: boolean) => {
    await updateBioLink(id, { enabled: !current });
    await loadLinks();
  };

  const moveLink = async (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === links.length - 1) return;
    
    const newLinks = [...links];
    const target = dir === 'up' ? index - 1 : index + 1;
    [newLinks[index], newLinks[target]] = [newLinks[target], newLinks[index]];
    
    // Update order values
    newLinks.forEach((l, i) => l.order = i);
    setLinks(newLinks);
    await updateBioLinksOrder(newLinks);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    alert('Link Copied!');
  };

  const handleThemeChange = async (key: string, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    await updateBusinessProfile(business.id, { bioTheme: newTheme });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Universal Bio Link</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your biolink, appearance, and routing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition">
            <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy Link</span>
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition">
            <ExternalLink className="w-4 h-4" /> View Profile
          </a>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {[
              { id: 'links', icon: LinkIcon, label: 'Links' },
              { id: 'appearance', icon: Palette, label: 'Appearance' },
              { id: 'analytics', icon: BarChart2, label: 'Analytics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition flex-1 justify-center whitespace-nowrap \${
                  activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }\`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'links' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900">My Links</h3>
                <button 
                  onClick={() => {
                    setEditingLink(null); setTitle(''); setUrl(''); setType('custom'); setIsEditing(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition"
                >
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>

              {isEditing && (
                <form onSubmit={handleSaveLink} className="mb-6 p-5 border border-slate-200 rounded-xl space-y-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Platform</label>
                      <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                        {LINK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Display Title</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. My Website" required className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">URL</label>
                      <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition flex items-center gap-2">
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Link
                    </button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="py-12 flex justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : links.length === 0 && !isEditing ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">No Links Yet</h3>
                  <p className="text-slate-500 text-sm mb-4">Add your first link to start building your bio page.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link, index) => {
                    const typeData = LINK_TYPES.find(t => t.id === link.type) || LINK_TYPES.find(t => t.id === 'custom')!;
                    const Icon = typeData.icon;
                    return (
                      <div key={link.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition group">
                        <div className="flex flex-col gap-1 items-center px-1">
                          <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition"><MoveUp className="w-3 h-3" /></button>
                          <GripVertical className="w-4 h-4 text-slate-300" />
                          <button onClick={() => moveLink(index, 'down')} disabled={index === links.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition"><MoveDown className="w-3 h-3" /></button>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                          <Icon className="w-6 h-6 text-slate-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 truncate">{link.title}</div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{link.url}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 px-2">
                          <button onClick={() => toggleLink(link.id, link.enabled)} className={\`w-11 h-6 rounded-full flex items-center transition-colors \${link.enabled ? 'bg-emerald-500' : 'bg-slate-300'}\`}>
                            <div className={\`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform \${link.enabled ? 'translate-x-5' : 'translate-x-1'}\`} />
                          </button>
                          <button onClick={() => {
                            setEditingLink(link); setType(link.type); setTitle(link.title); setUrl(link.url); setIsEditing(true);
                          }} className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteLink(link.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-4">Profile Branding</h3>
                <p className="text-sm text-slate-500 mb-6">Update your main store profile to change your photo and bio here.</p>
                <div className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <SafeImage src={business.logo} alt={business.name} fallbackType="avatar" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">@{business.username || business.slug}</div>
                    <div className="text-sm text-slate-500">{business.name}</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="font-bold text-lg text-slate-900 mb-4">Design Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Background Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.backgroundColor} onChange={e => handleThemeChange('backgroundColor', e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={theme.backgroundColor} onChange={e => handleThemeChange('backgroundColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg font-mono text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Text Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.textColor} onChange={e => handleThemeChange('textColor', e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={theme.textColor} onChange={e => handleThemeChange('textColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg font-mono text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Button Background</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.buttonColor} onChange={e => handleThemeChange('buttonColor', e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={theme.buttonColor} onChange={e => handleThemeChange('buttonColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg font-mono text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Button Text</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.buttonTextColor} onChange={e => handleThemeChange('buttonTextColor', e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={theme.buttonTextColor} onChange={e => handleThemeChange('buttonTextColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg font-mono text-sm" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Button Shape</label>
                    <div className="flex gap-3">
                      {['rounded', 'pill', 'square'].map(shape => (
                        <button key={shape} onClick={() => handleThemeChange('buttonStyle', shape)} className={\`flex-1 py-3 border \${theme.buttonStyle === shape ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-50'} font-bold text-sm capitalize transition\`} style={{ borderRadius: shape === 'pill' ? '999px' : shape === 'rounded' ? '12px' : '0px' }}>
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" /> Link Analytics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{analytics.views}</div>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <MousePointerClick className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{analytics.clicks}</div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Clicks per Link</h4>
                <div className="space-y-3">
                  {links.filter(l => l.enabled).map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                      <div className="font-semibold text-slate-800 truncate pr-4">{link.title}</div>
                      <div className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                        {((analytics.clicksPerLink as any)[link.id] || 0)}
                      </div>
                    </div>
                  ))}
                  {links.length === 0 && <div className="text-sm text-slate-500">No active links to track.</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Pane */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Live Preview
            </h3>
            <div className="border-[8px] border-slate-900 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl relative h-[650px]">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-xl w-32 mx-auto z-50"></div>
              
              <div className="w-full h-full overflow-y-auto hide-scrollbar" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
                <div className="p-6 text-center">
                  {business.logo ? (
                    <img src={business.logo} alt={business.name} className="w-24 h-24 rounded-full mx-auto object-cover mb-4 shadow-lg border-2 border-white/20" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                      {business.name.charAt(0)}
                    </div>
                  )}
                  <h2 className="font-bold text-lg leading-tight" style={{ color: theme.textColor }}>{business.name}</h2>
                  <p className="opacity-80 text-sm mt-1 mb-6">@{business.username || business.slug}</p>
                  
                  {(business.bio || business.description || business.tagline) && (
                    <p className="text-sm mb-6 opacity-90">{business.bio || business.description || business.tagline}</p>
                  )}

                  <div className="space-y-3">
                    {links.filter(l => l.enabled).map(link => (
                      <div 
                        key={link.id} 
                        className="p-3 text-center font-bold text-sm shadow-sm transition hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: theme.buttonColor, 
                          color: theme.buttonTextColor,
                          borderRadius: theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'rounded' ? '12px' : '0px',
                          border: \`1px solid \${theme.textColor}15\`
                        }}
                      >
                        {link.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="font-bold text-sm text-slate-900 mb-3">Your QR Code</div>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto rounded-xl shadow-sm" />
              ) : (
                <div className="w-32 h-32 mx-auto bg-slate-100 rounded-xl animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
`

const viewCode = `import { recordAnalyticsEvent } from '../../services/firebaseService';
import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { BusinessProfile } from '../../types';
import { getBioLinks, recordBioLinkClick, recordBioLinkView } from '../../services/firebaseService';
import { Instagram, Youtube, Facebook, Twitter, Smartphone, ExternalLink, Link as LinkIcon, Mail, MessageCircle, Send, Linkedin, MessageSquare, FileText, Folder, Globe, Phone, Briefcase, ShoppingBag } from 'lucide-react';

interface Props {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'whatsapp':
    case 'whatsapp_community': return MessageCircle;
    case 'instagram': return Instagram;
    case 'youtube': return Youtube;
    case 'facebook': return Facebook;
    case 'twitter': return Twitter;
    case 'telegram': return Send;
    case 'linkedin': return Linkedin;
    case 'discord': return MessageSquare;
    case 'google_form':
    case 'google_sheet':
    case 'google_doc': return FileText;
    case 'gdrive': return Folder;
    case 'website': return Globe;
    case 'portfolio': return Briefcase;
    case 'digital_store': return ShoppingBag;
    case 'email': return Mail;
    case 'phone': return Phone;
    default: return LinkIcon;
  }
};

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = business.bioTheme || {
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    buttonStyle: 'rounded',
    buttonColor: '#ffffff',
    buttonTextColor: '#0f172a',
  };

  useEffect(() => {
    // SEO
    const title = business.seoMetaTitle || \`\${business.name} | Links\`;
    document.title = title;
    recordBioLinkView(business.id);
    loadLinks();
  }, [business.id]);

  const loadLinks = async () => {
    const data = await getBioLinks(business.id);
    setLinks(data.filter((l: any) => l.enabled).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    recordAnalyticsEvent(business.id, 'bio_views', { slug: business.slug }).catch(() => {});
    setLoading(false);
  };

  const handleLinkClick = async (link: any) => {
    recordBioLinkClick(business.id, link.id).catch(console.error);
    let finalUrl = link.url;
    if (!/^https?:\\/\\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      
      {/* Banner */}
      {business.banner && (
        <div className="w-full h-48 sm:h-64 bg-cover bg-center" style={{ backgroundImage: \`url(\${business.banner})\` }} />
      )}
      
      <div className={\`w-full max-w-2xl px-4 \${business.banner ? '-mt-20' : 'pt-16'} pb-24 relative z-10\`}>
        
        <div className="text-center mb-8">
          {business.logo ? (
            <img src={business.logo} alt={business.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto object-cover shadow-xl border-4 border-white/10 mb-4" />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-white/10 mb-4" style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}>
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textColor }}>{business.name}</h1>
          <p className="font-semibold text-sm opacity-80 mt-1">@{business.username || business.slug}</p>
          
          {(business.bio || business.description || business.tagline) && (
            <p className="mt-4 opacity-90 leading-relaxed text-sm max-w-md mx-auto whitespace-pre-wrap px-4">
              {business.bio || business.description || business.tagline}
            </p>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center opacity-50 flex justify-center"><div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-4 px-2">
            {links.map((link) => {
              const Icon = getIcon(link.type);
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className="w-full group relative flex items-center p-4 hover:scale-[1.02] transition-transform cursor-pointer shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: theme.buttonTextColor,
                    borderRadius: theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'rounded' ? '16px' : '0px',
                    border: \`1px solid \${theme.textColor}15\`
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/5 rounded-full mr-4">
                    <Icon className="w-5 h-5 opacity-90" />
                  </div>
                  <span className="font-bold flex-1 text-left text-sm sm:text-base pr-8">{link.title}</span>
                  <ExternalLink className="absolute right-6 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                </button>
              );
            })}
            
            {links.length === 0 && (
              <div className="text-center opacity-50 py-10 text-sm">No links available yet.</div>
            )}
          </div>
        )}
      </div>

      <div className="pb-8 opacity-40 text-xs font-bold uppercase tracking-widest mt-auto">
        Powered by Storelly
      </div>

      {onBackToDashboard && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={onBackToDashboard} className="px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl font-bold text-sm hover:bg-slate-800 transition hover:scale-105 active:scale-95">
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
`

fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', managerCode);
fs.writeFileSync('src/components/biolink/BioProfileView.tsx', viewCode);
console.log("Written!");
