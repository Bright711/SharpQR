import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface QRCodeImageProps {
  value: string; // The URL or text value to encode in the QR Code
  title?: string;
  subtitle?: string;
  size?: number;
  showActions?: boolean;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  value,
  title = "SmartQR",
  subtitle = "Scan to Access",
  size = 220,
  showActions = true,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Generate on high-quality internal canvas first for downloading, and get data URL for img
        const url = await QRCode.toDataURL(value, {
          width: size * 2, // higher resolution for printing/downloads
          margin: 1,
          color: {
            dark: '#0f172a', // slate-900
            light: '#ffffff', // white
          },
        });
        setQrUrl(url);

        // draw to local canvas hook if needed for download scaling
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
        }
      } catch (err: any) {
        console.error('QR Generation failed:', err);
        setError('QR Generation failed');
      }
    };

    generateQR();
  }, [value, size]);

  const handleDownloadPNG = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `smartqr-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    // Generate a basic print-friendly style container that triggers browser PDF print or saves it safely
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download/print QR PDFs.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>SmartQR Code - ${title}</title>
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background-color: white;
              color: #0f172a;
              text-align: center;
            }
            .qr-card {
              border: 3px double #0f172a;
              padding: 40px;
              border-radius: 12px;
              max-width: 400px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
            .qr-img { width: 280px; height: 280px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
            .footer-text { font-size: 11px; color: #94a3b8; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle}</div>
            <img class="qr-img" src="${qrUrl}" />
            <div class="footer-text">SMARTQR LEARNING ACCESS PLATFORM</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-xs border border-slate-100 max-w-[280px]">
      <div className="text-center mb-2">
        <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{title}</h4>
        <p className="text-xs text-slate-500 truncate max-w-[200px]">{subtitle}</p>
      </div>

      <div className="relative p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Generated QR Code"
            className="rounded shadow-xs transition-all duration-300"
            style={{ width: size, height: size }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div 
            className="flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-xs text-center rounded"
            style={{ width: size, height: size }}
          >
            {error || 'Generating QR...'}
          </div>
        )}
      </div>

      {showActions && qrUrl && (
        <div className="flex items-center gap-1.5 mt-3 w-full">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition border border-slate-200"
            title="Download PNG File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition border border-slate-200"
            title="Print PDF File"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF/Print</span>
          </button>
        </div>
      )}
    </div>
  );
};
