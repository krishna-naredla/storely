import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Sparkles,
  Printer,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { QRCodeSVG } from 'qrcode.react';

export interface ModuleQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  url: string;
  businessName?: string;
  logoUrl?: string;
  accentColor?: 'indigo' | 'emerald' | 'purple' | 'blue' | 'rose' | 'amber';
}

export const ModuleQrModal: React.FC<ModuleQrModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  url,
  businessName,
  logoUrl,
  accentColor = 'indigo',
}) => {
  const [copied, setCopied] = useState(false);
  const [qrPngDataUrl, setQrPngDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const displayUrl = url ? url.replace(/^https?:\/\//, '') : '';

  useEffect(() => {
    if (!isOpen || !url) return;

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUri) => {
        if (isMounted) {
          setQrPngDataUrl(dataUri);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate module QR:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    // Attempt high-res canvas rendering from SVG or precomputed PNG
    if (qrPngDataUrl) {
      const a = document.createElement('a');
      a.href = qrPngDataUrl;
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `${safeTitle}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 60, 60, 880, 880);
        const pngFile = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        a.download = `${safeTitle}-qr.png`;
        a.href = pngFile;
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `✨ *${businessName || 'Storelly'}* - ${title}\n` +
      `${subtitle ? `${subtitle}\n\n` : '\n'}` +
      `👉 Access directly here:\n${url}\n\n` +
      `Scan QR or tap link to open instantly!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrintFlyer = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - QR Code Poster</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: #ffffff;
            }
            .poster-card {
              max-width: 520px;
              width: 100%;
              border: 3px solid #e2e8f0;
              border-radius: 28px;
              padding: 40px 32px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .brand {
              font-size: 16px;
              font-weight: 700;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            h1 {
              font-size: 26px;
              font-weight: 800;
              margin: 0 0 10px 0;
              color: #0f172a;
            }
            p.sub {
              font-size: 14px;
              color: #64748b;
              margin: 0 0 28px 0;
              line-height: 1.5;
            }
            .qr-wrap {
              display: inline-block;
              padding: 16px;
              background: #ffffff;
              border: 2px solid #cbd5e1;
              border-radius: 20px;
              margin-bottom: 24px;
            }
            .qr-wrap img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .scan-tip {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 6px;
            }
            .url {
              font-size: 12px;
              font-family: monospace;
              color: #64748b;
              word-break: break-all;
              padding: 8px 14px;
              background: #f8fafc;
              border-radius: 10px;
              display: inline-block;
              max-width: 100%;
            }
            .footer {
              margin-top: 28px;
              font-size: 11px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            ${businessName ? `<div class="brand">${businessName}</div>` : ''}
            <h1>${title}</h1>
            ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
            <div class="qr-wrap">
              <img src="${qrPngDataUrl}" alt="QR Code" />
            </div>
            <div class="scan-tip">📲 Scan with your smartphone camera</div>
            <div class="url">${url}</div>
            <div class="footer">Powered by Storelly</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getAccentClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5 pr-8">
          {badge && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-1 ${getAccentClass()}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </div>
          )}
          <h3 className="text-xl font-black text-slate-900 font-heading leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* QR Code Scannable Canvas Container */}
        <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-5 text-center">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 mb-3 relative group">
            {qrPngDataUrl ? (
              <img
                src={qrPngDataUrl}
                alt={`${title} QR Code`}
                className="w-48 h-48 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <QRCodeSVG
                  ref={svgRef}
                  value={url}
                  size={192}
                  level="H"
                  includeMargin={true}
                  imageSettings={
                    logoUrl
                      ? {
                          src: logoUrl,
                          x: undefined,
                          y: undefined,
                          height: 32,
                          width: 32,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
            )}
            <span className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              Live Scannable
            </span>
          </div>

          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Scan with phone camera to open</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Customers can scan this code to access directly
          </p>

          {/* Download & Print Quick Row */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Download high-resolution PNG file for stickers or printing"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrintFlyer}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Print standard tabletop sign or flyer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>

        {/* Link Display and Copy Action */}
        <div className="space-y-2 mb-4">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Direct Public Link
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-2 gap-2">
            <input
              type="text"
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-transparent font-mono text-xs text-slate-700 font-semibold focus:outline-none select-all truncate px-1"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: WhatsApp and Open Live */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => window.open(url, '_blank')}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
