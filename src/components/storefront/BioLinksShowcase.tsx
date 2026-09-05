import React from 'react';
import { ChevronRight } from 'lucide-react';
import { recordBioLinkClick } from '../../services/firebaseService';
import { SocialBrandIcon, getBrandConfig } from '../biolink/SocialBrandIcons';

export const BioLinksShowcase = ({ links, business }: { links: any[]; business: any }) => {
  if (!links || links.length === 0) return null;

  const theme = business.bioTheme || {
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    buttonStyle: 'rounded',
    buttonColor: '#ffffff',
    buttonTextColor: '#0f172a',
  };

  const getRadiusClass = () => {
    if (theme.buttonStyle === 'pill') return 'rounded-full';
    if (theme.buttonStyle === 'square') return 'rounded-lg';
    return 'rounded-2xl';
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 mb-8 px-4">
      {links.map((link) => {
        const brand = getBrandConfig(link.type);
        const displaySubtitle = link.subtitle || brand.defaultSubtitle;

        return (
          <a
            key={link.id}
            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              recordBioLinkClick(business.id, link.id).catch(console.error);
            }}
            className={`w-full group text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] flex items-center p-3 sm:p-3.5 border ${getRadiusClass()}`}
            style={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Authentic Brand Icon Container */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-3.5 shadow-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                background:
                  link.type === 'instagram'
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : brand.color,
              }}
            >
              <SocialBrandIcon type={link.type} size={22} className="w-5.5 h-5.5 text-white" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-bold text-sm sm:text-base leading-snug truncate">
                {link.title}
              </div>
              {displaySubtitle && (
                <div className="text-xs text-slate-500 leading-tight truncate mt-0.5">
                  {displaySubtitle}
                </div>
              )}
            </div>

            {/* Right Chevron Indicator */}
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0 pl-1">
              <ChevronRight className="w-5 h-5" />
            </div>
          </a>
        );
      })}
    </div>
  );
};
