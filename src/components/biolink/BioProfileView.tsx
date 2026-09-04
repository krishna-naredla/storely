import { recordAnalyticsEvent } from '../../services/firebaseService';
import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { BusinessProfile, CatalogItem } from '../../types';
import { getBioLinks, recordBioLinkClick, recordBioLinkView, getCatalogItems } from '../../services/firebaseService';
import { Instagram, Youtube, Facebook, Twitter, Smartphone, ExternalLink, Link as LinkIcon, Mail } from 'lucide-react';

interface Props {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'whatsapp':
    case 'whatsapp_community':
      return Smartphone;
    case 'instagram':
      return Instagram;
    case 'youtube':
      return Youtube;
    case 'facebook':
      return Facebook;
    case 'twitter':
      return Twitter;
    case 'telegram':
      return ExternalLink;
    case 'linkedin':
      return ExternalLink;
    case 'discord':
      return ExternalLink;
    case 'google_form':
    case 'google_sheet':
    case 'google_doc':
    case 'gdrive':
      return LinkIcon;
    case 'website':
      return ExternalLink;
    case 'email':
      return Mail;
    case 'phone':
      return Smartphone;
    default:
      return LinkIcon;
  }
};

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
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
    
    // Load top 3 catalog items to feature
    const items = await getCatalogItems(business.id);
    setCatalogItems(items.filter(i => i.inStock !== false).slice(0, 3));
    
    setLoading(false);
  };

  const handleLinkClick = async (link: any) => {
    // Non-blocking analytics
    recordBioLinkClick(business.id, link.id).catch(console.error);
    
    // Ensure absolute URL
    let finalUrl = link.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
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
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className="w-full group relative flex items-center justify-center p-4 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-2xl transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute left-4 w-10 h-10 bg-slate-50 group-hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <span className="font-bold text-slate-800">{link.title}</span>
                </button>
              );
            })}
            
            
        {/* Featured Store Items */}
        {catalogItems.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 text-left">
              {business.type === 'digital_creator' ? 'Digital Products & Services' : 'Featured Products'}
            </h2>
            <div className="space-y-4">
              {catalogItems.map(item => (
                <div key={item.id} className="flex items-center p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-left group hover:border-emerald-500 transition-colors">
                  <div className="relative">
                    {item.images?.[0] ? (
                      <SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-16 h-16 rounded-xl object-cover mr-4" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mr-4 text-slate-400">
                        {item.productType === 'digital_file' ? <LinkIcon className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                      </div>
                    )}
                    {item.productType === 'digital_file' && (
                      <div className="absolute -top-1 -left-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                        FILE
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{item.shortDescription || item.detailedDescription}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-emerald-600 font-bold text-sm">
                        {item.price === 0 ? 'FREE' : `${business.currencySymbol}${item.price}`}
                      </div>
                      {item.productType === 'consultation_slot' && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          • {item.consultationDuration} MIN SESSION
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                       // Direct to store for now, future: direct "Get" or "Book" flow
                       window.location.href = `/store/${business.slug}?item=${item.id}`;
                    }}
                    className="ml-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
                  >
                    {item.productType === 'consultation_slot' ? 'BOOK' : (item.price === 0 ? 'GET' : 'BUY')}
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => window.location.href = `/store/${business.slug}`}
              className="mt-4 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
            >
              Visit Storefront
            </button>
          </div>
        )}

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
