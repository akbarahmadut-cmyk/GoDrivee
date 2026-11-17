import { useState } from 'react';
import {
  Download,
  PlusSquare,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'hero' | 'surface';
  className?: string;
}

export function PWAInstallButton({
  variant = 'surface',
  className = '',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonClass = `${
    variant === 'hero'
      ? 'min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer'
      : 'min-h-[44px] px-4 py-2 rounded-xl bg-[#E3F5F2] hover:bg-[#D2EFEA] text-[#0B7A6B] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer'
  } ${className}`.trim();

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={buttonClass}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Pasang Aplikasi</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={buttonClass}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#172124]/50 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white text-[#172124] p-5 border border-[#E4E8EA] shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="ios-install-title"
                    className="text-base font-bold text-[#172124]"
                  >
                    Pasang GoDrive di iPhone / iPad
                  </h3>
                  <p className="text-xs text-[#5B676D] mt-0.5">
                    Buka seperti aplikasi langsung dari layar utama Safari.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup panduan"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-10 h-10 rounded-xl bg-[#F2F5F5] hover:bg-[#E6ECEB] text-[#5B676D] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-3 text-sm text-[#172124]">
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0 mt-0.5">
                    <Share className="w-4 h-4" />
                  </span>
                  <span>
                    Ketuk tombol <strong className="font-semibold">Bagikan (Share)</strong> pada bilah navigasi Safari.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </span>
                  <span>
                    Gulir ke bawah lalu pilih{' '}
                    <strong className="font-semibold">Tambah ke Layar Utama</strong> (Add to Home Screen).
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#172124] text-white px-3.5 py-2.5 text-xs font-medium shadow-lg border border-white/10"
    >
      <WifiOff className="w-4 h-4 text-[#F39C34] shrink-0" />
      <span>Mode Offline — Data tersimpan digunakan</span>
    </div>
  );
}
