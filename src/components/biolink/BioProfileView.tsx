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
    case 'whatsapp_community':
      return MessageCircle;
    case 'instagram':
      return Instagram;
    case 'youtube':
      return Youtube;
    case 'facebook':
      return Facebook;
    case 'twitter':
      return Twitter;
    case 'telegram':
      return Send;
    case 'linkedin':
      return Linkedin;
    case 'discord':
      return MessageSquare;
    case 'google_form':
    case 'google_sheet':
    case 'google_doc':
      return FileText;
    case 'gdrive':
      return Folder;
    case 'website':
      return Globe;
    case 'portfolio':
      return Briefcase;
    case 'digital_store':
      return ShoppingBag;
    case 'email':
      return Mail;
    case 'phone':
      return Phone;
    default:
      return LinkIcon;
  }
};

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamic SEO Update
    const title = business.seoMetaTitle || `${business.name} | Storelly`;
    const description = business.seoMetaDescription || business.tagline || business.description || '';
    const image = business.seoMetaImage || business.logo || '';
    
    
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', business.description || `Official links and resources for ${business.name}.`);
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: business.description || `Links for ${business.name}` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'profile' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });

    
    // Meta tags helper
    const updateMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      let el = isProperty 
        ? document.querySelector(`meta[property="${name}"]`)
        : document.querySelector(`meta[name="${name}"]`);
        
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', business.seoMetaKeywords || '');
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image, true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    recordBioLinkView(business.id);
    loadLinks();
  }, [business.id]);

  const loadLinks = async () => {
    const data = await getBioLinks(business.id);
    setLinks(data.filter((l: any) => l.enabled));
    recordAnalyticsEvent(business.id, 'bio_views', { slug: business.slug }).catch(() => {});
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Banner */}
      <div 
        className="w-full h-48 sm:h-64 bg-emerald-800 bg-cover bg-center"
        style={{ backgroundImage: business.banner ? `url(${business.banner})` : undefined }}
      />
      
      <div className="max-w-xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-24 relative z-10 text-center">
        {/* Profile Image */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
          {business.logo ? (
            <SafeImage src={business.logo} alt={business.name} fallbackType="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl font-black">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="mt-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{business.name}</h1>
          <p className="text-emerald-600 font-semibold text-sm mb-3">@{business.username || business.slug}</p>
          {(business.bio || business.description || business.tagline) && (
            <p className="text-slate-600 leading-relaxed text-sm max-w-md mx-auto whitespace-pre-wrap">
              {business.bio || business.description || business.tagline}
            </p>
          )}
        </div>

        {/* Links */}
        {loading ? (
          <div className="py-10 text-slate-500">Loading links...</div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => {
              const Icon = getIcon(link.type);
              return (
                <a
                  key={link.id}
                  href={link.url.match(/^https?:\/\//i) ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    recordBioLinkClick(business.id, link.id).catch(console.error);
                  }}
                  className="w-full group relative flex items-center justify-center p-4 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-2xl transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute left-4 w-10 h-10 bg-slate-50 group-hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <span className="font-bold text-slate-800">{link.title}</span>
                </a>
              );
            })}

            {links.length === 0 && (
              <div className="text-slate-500 py-10">No links available yet.</div>
            )}
          </div>
        )}

        {/* Admin floating button */}
        {onBackToDashboard && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={onBackToDashboard}
              className="px-6 py-3 bg-slate-900 text-white rounded-full shadow-lg font-semibold text-sm hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-16 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest pb-8">
          Powered by Storelly
        </div>
      </div>
    </div>
  );
};
