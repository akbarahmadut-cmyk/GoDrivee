import { useState } from 'react';
import { ArrowLeft, Bike, Eye, EyeOff, Lock, Phone, Store, UserPlus } from 'lucide-react';

export interface PartnerSession {
  role: 'umkm' | 'driver';
  name: string;
  phone: string;
  loggedInAt: number;
}

interface PartnerAccountRecord {
  name: string;
  phone: string;
  pin: string;
}

const ACCOUNTS_KEY = (role: 'umkm' | 'driver') => `gd-partner-accounts-${role}`;

function loadAccounts(role: 'umkm' | 'driver'): PartnerAccountRecord[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY(role));
    return raw ? (JSON.parse(raw) as PartnerAccountRecord[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(role: 'umkm' | 'driver', list: PartnerAccountRecord[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY(role), JSON.stringify(list));
  } catch {
    // Abaikan jika localStorage tidak tersedia.
  }
}

interface PartnerAuthViewProps {
  role: 'umkm' | 'driver';
  onSuccess: (session: PartnerSession) => void;
  onBack: () => void;
}

export function PartnerAuthView({ role, onSuccess, onBack }: PartnerAuthViewProps) {
  const isDriver = role === 'driver';
  const title = isDriver ? 'Login Mitra Driver' : 'Login Mitra Pedagang';
  const subtitle = isDriver
    ? 'Masuk ke kokpit pengemudi GoDrive'
    : 'Masuk untuk kelola toko, menu & pesanan';
  const accent = isDriver ? '#0F9D8A' : '#FF7A1A';
  const accentDark = isDriver ? '#0B7A6B' : '#C4510A';
  const accentTint = isDriver ? 'bg-[#E6F6F3] text-[#0B7A6B]' : 'bg-[#FFF1E6] text-[#C4510A]';
  const Icon = isDriver ? Bike : Store;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const normalizePhone = (p: string) => p.replace(/\s|-/g, '').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 8) {
      setError('Masukkan nomor HP / WhatsApp yang valid (minimal 8 digit).');
      return;
    }
    if (pin.trim().length < 4) {
      setError('PIN / Kata sandi minimal 4 karakter.');
      return;
    }

    const accounts = loadAccounts(role);

    if (mode === 'register') {
      if (!name.trim()) {
        setError(isDriver ? 'Masukkan nama lengkap driver.' : 'Masukkan nama toko / pemilik.');
        return;
      }
      const existingIdx = accounts.findIndex((a) => a.phone === cleanPhone);
      const record: PartnerAccountRecord = {
        name: name.trim(),
        phone: cleanPhone,
        pin: pin.trim(),
      };
      if (existingIdx >= 0) {
        accounts[existingIdx] = record;
      } else {
        accounts.push(record);
      }
      saveAccounts(role, accounts);
      onSuccess({
        role,
        name: record.name,
        phone: record.phone,
        loggedInAt: Date.now(),
      });
      return;
    }

    // Mode login
    const found = accounts.find((a) => a.phone === cleanPhone);
    if (found) {
      if (found.pin !== pin.trim()) {
        setError('PIN / Kata sandi salah. Silakan coba lagi.');
        return;
      }
      onSuccess({
        role,
        name: found.name,
        phone: found.phone,
        loggedInAt: Date.now(),
      });
      return;
    }

    // Jika belum pernah daftar di perangkat ini, otomatis buat akun agar mudah dites
    const fallbackName = isDriver ? 'Driver GoDrive' : 'Warung Kahu';
    const newRecord: PartnerAccountRecord = {
      name: fallbackName,
      phone: cleanPhone,
      pin: pin.trim(),
    };
    accounts.push(newRecord);
    saveAccounts(role, accounts);
    onSuccess({
      role,
      name: newRecord.name,
      phone: newRecord.phone,
      loggedInAt: Date.now(),
    });
  };

  const handleDemoLogin = () => {
    onSuccess({
      role,
      name: isDriver ? 'Bapak Andi (Driver)' : 'Warung Kahu',
      phone: '081234567890',
      loggedInAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7F7] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4E8EA] px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[38px] px-3 rounded-xl bg-[#F5F7F7] text-xs font-semibold text-[#172124] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Akun
        </button>
        <span className="text-xs font-bold" style={{ color: accentDark }}>
          {isDriver ? 'Mitra Driver' : 'Mitra Pedagang'}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E4E8EA] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl ${accentTint} flex items-center justify-center shrink-0`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#172124]">{title}</h1>
              <p className="text-xs text-[#5B676D]">{subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#F5F7F7] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`min-h-[40px] rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                mode === 'login' ? 'bg-white text-[#172124] shadow-xs' : 'text-[#5B676D]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`min-h-[40px] rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1 ${
                mode === 'register' ? 'bg-white text-[#172124] shadow-xs' : 'text-[#5B676D]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Daftar Baru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <label className="block">
                <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                  {isDriver ? 'Nama Lengkap Driver' : 'Nama Toko / Usaha'}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isDriver ? 'Contoh: Andi Saputra' : 'Contoh: Warung Coto Kahu'}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
              </label>
            )}

            <label className="block">
              <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                Nomor HP / WhatsApp
              </span>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                PIN / Kata Sandi
              </span>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Minimal 4 digit / karakter"
                  className="w-full min-h-[48px] pl-10 pr-10 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  aria-label="Tampilkan PIN"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7780] p-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{ backgroundColor: accent }}
              className="w-full min-h-[50px] rounded-2xl text-white text-sm font-bold cursor-pointer shadow-sm"
            >
              {mode === 'login'
                ? `Masuk sebagai ${isDriver ? 'Driver' : 'Mitra Pedagang'}`
                : `Daftar & Masuk`}
            </button>
          </form>

          <div className="pt-2 border-t border-[#F0F3F4] space-y-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full min-h-[42px] rounded-xl bg-[#F5F7F7] hover:bg-[#EAEFEF] text-xs font-semibold text-[#172124] cursor-pointer transition-colors"
            >
              Masuk Cepat (Akun Demo {isDriver ? 'Driver' : 'Mitra Pedagang'})
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
