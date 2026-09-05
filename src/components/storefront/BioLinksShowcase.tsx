import React from 'react';
import { ExternalLink, Instagram, Youtube, Facebook, Twitter, Send, Linkedin, MessageSquare, FileText, Folder, Globe, Briefcase, ShoppingBag, Mail, Phone, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { recordBioLinkClick } from '../../services/firebaseService';

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

export const BioLinksShowcase = ({ links, business }: { links: any[], business: any }) => {
  if (!links || links.length === 0) return null;
  
  const theme = business.bioTheme || {
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    buttonStyle: 'rounded',
    buttonColor: '#ffffff',
    buttonTextColor: '#0f172a',
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 mb-8">
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
    </div>
  );
};
