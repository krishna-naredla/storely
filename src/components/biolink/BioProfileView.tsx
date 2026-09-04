import { recordAnalyticsEvent } from '../../services/firebaseService';
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
    const title = business.seoMetaTitle || `${business.name} | Links`;
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
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      
      {/* Banner */}
      {business.banner && (
        <div className="w-full h-48 sm:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${business.banner})` }} />
      )}
      
      <div className={`w-full max-w-2xl px-4 ${business.banner ? '-mt-20' : 'pt-16'} pb-24 relative z-10`}>
        
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
                <a
                  key={link.id}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => { recordBioLinkClick(business.id, link.id).catch(console.error); }}
                  className="w-full group relative flex items-center p-4 hover:scale-[1.02] transition-transform cursor-pointer shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: theme.buttonTextColor,
                    borderRadius: theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'rounded' ? '16px' : '0px',
                    border: `1px solid ${theme.textColor}15`
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/5 rounded-full mr-4">
                    <Icon className="w-5 h-5 opacity-90" />
                  </div>
                  <span className="font-bold flex-1 text-left text-sm sm:text-base pr-8">{link.title}</span>
                  <ExternalLink className="absolute right-6 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                </a>
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
