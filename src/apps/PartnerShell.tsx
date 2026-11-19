import { useContext, useState, type ComponentType, type ReactNode } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapsAvailabilityContext } from '../components/GoogleRouteMap';
import { OfflineIndicator } from '../components/PWAControls';

const RAW_MAPS_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
const GOOGLE_MAPS_API_KEY =
  RAW_MAPS_KEY && RAW_MAPS_KEY !== 'MY_GOOGLE_MAPS_API_KEY' ? RAW_MAPS_KEY : '';

/** Menyediakan Google Maps (jika API key tersedia) untuk aplikasi mitra. */
export function PartnerMapsProvider({ children }: { children: ReactNode }) {
  const parentMaps = useContext(MapsAvailabilityContext);
  if (parentMaps) return <>{children}</>;
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <MapsAvailabilityContext.Provider value={false}>
        {children}
      </MapsAvailabilityContext.Provider>
    );
  }
  return (
    <MapsAvailabilityContext.Provider value={true}>
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        language="id"
        region="ID"
        libraries={['places', 'marker']}
      >
        {children}
      </APIProvider>
    </MapsAvailabilityContext.Provider>
  );
}

export interface PartnerTab<K extends string> {
  key: K;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface PartnerShellProps<K extends string> {
  appName: string;
  subtitle: string;
  accent: string;
  tabs: PartnerTab<K>[];
  onBack?: () => void;
  onLogout?: () => void;
  render: (tab: K, showToast: (msg: string) => void) => ReactNode;
}

/** Kerangka bersama untuk aplikasi Driver dan UMKM: header, konten, navigasi bawah. */
export function PartnerShell<K extends string>({
  appName,
  subtitle,
  accent,
  tabs,
  onBack,
  onLogout,
  render,
}: PartnerShellProps<K>) {
  const [tab, setTab] = useState<K>(tabs[0].key);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <PartnerMapsProvider>
      <div className="min-h-screen flex flex-col bg-[#F5F7F7]">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E8EA]">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="min-h-[38px] px-2.5 rounded-xl bg-[#F5F7F7] text-xs font-semibold text-[#172124] inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Pelanggan
                </button>
              )}
              <div>
                <h1 className="text-base font-bold" style={{ color: accent }}>
                  {appName}
                </h1>
                <p className="text-[11px] text-[#5B676D] leading-none">{subtitle}</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`py-1 cursor-pointer ${
                    tab === key
                      ? 'font-semibold border-b-2'
                      : 'text-[#5B676D] hover:text-[#172124]'
                  }`}
                  style={tab === key ? { color: accent, borderColor: accent } : undefined}
                >
                  {label}
                </button>
              ))}
            </nav>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[36px] px-2.5 rounded-xl bg-[#F5F7F7] hover:bg-[#EAEFEF] text-xs font-semibold text-[#172124] inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-24 md:pb-10">
          {render(tab, showToast)}
        </main>

        <nav
          aria-label="Navigasi bawah"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E8EA] h-16 pb-safe grid"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                style={{ color: active ? accent : '#6B7780' }}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
                <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <OfflineIndicator />

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-50 max-w-[90vw] px-4 py-2.5 rounded-xl bg-[#172124] text-white text-sm font-medium shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </PartnerMapsProvider>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-[#E4E8EA] rounded-2xl p-4 ${className}`}>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-[#F5F7F7] p-3 text-center">
      <p className="text-lg font-bold font-num">{value}</p>
      <p className="text-xs text-[#5B676D]">{label}</p>
    </div>
  );
}

export function SwitchAppLinks({ current }: { current: 'customer' | 'driver' | 'umkm' }) {
  const links = [
    { key: 'customer', label: 'Aplikasi Customer', href: '/' },
    { key: 'driver', label: 'Aplikasi Driver', href: '/driver' },
    { key: 'umkm', label: 'Aplikasi UMKM', href: '/umkm' },
  ].filter((l) => l.key !== current);
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E4E8EA] bg-white text-xs font-semibold text-[#172124] hover:bg-[#F5F7F7]"
        >
          Buka {l.label}
        </a>
      ))}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#5B676D] mb-1">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[48px] px-3 rounded-xl border border-[#DCE2E4] bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
      />
    </label>
  );
}
