import React, { useState, useEffect } from 'react';
import { BusinessProfile, CatalogItem } from '../../types';
import { getBioLinks, recordBioLinkClick, getCatalogItems } from '../../services/firebaseService';
import { Instagram, Youtube, Facebook, Twitter, Smartphone, ExternalLink, Link as LinkIcon } from 'lucide-react';

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
    case 'website':
      return ExternalLink;
    default:
      return LinkIcon;
  }
};

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${business.name} | Storelly`;
    loadLinks();
  }, [business.id]);

  const loadLinks = async () => {
    const data = await getBioLinks(business.id);
    setLinks(data.filter((l: any) => l.enabled));
    
    // Load top 3 catalog items to feature
    const items = await getCatalogItems(business.id);
    setCatalogItems(items.filter(i => i.inStock !== false).slice(0, 3));
    
    setLoading(false);
  };

  const handleLinkClick = async (link: any) => {
    await recordBioLinkClick(link.id);
    window.open(link.url, '_blank');
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
            <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl font-black">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="mt-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{business.name}</h1>
          <p className="text-emerald-600 font-semibold text-sm mb-3">@{business.slug}</p>
          {(business.description || business.tagline) && (
            <p className="text-slate-600 leading-relaxed text-sm max-w-md mx-auto">
              {business.description || business.tagline}
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
            <h2 className="text-xl font-bold text-slate-900 mb-4 text-left">Featured Products</h2>
            <div className="space-y-4">
              {catalogItems.map(item => (
                <div key={item.id} className="flex items-center p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                  {item.images?.[0] && (
                    <img src={item.images[0]} alt={item.title} className="w-16 h-16 rounded-xl object-cover mr-4" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    <div className="text-emerald-600 font-bold text-sm mt-1">
                      {item.price === 0 ? 'Free' : `${business.currencySymbol}${item.price}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                       // Just redirect to the full store with item query
                       window.location.href = `/store/${business.slug}`;
                    }}
                    className="ml-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    {item.isBookable ? 'Book' : (item.price === 0 ? 'Get' : 'Buy')}
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => window.location.href = `/store/${business.slug}`}
              className="mt-4 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
            >
              View All Products
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
