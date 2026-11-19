import { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  HandHeart,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react';
import { formatRupiah, type RootTab } from '../data/jalanKitaData';
import { useLocalState } from '../hooks/useLocalState';
import { PWAInstallButton } from './PWAControls';

export interface CustomerSession {
  name: string;
  identifier: string;
  method: 'phone' | 'email';
  loggedInAt: number;
}

interface StoredCustomerAccount {
  name: string;
  identifier: string;
  method: 'phone' | 'email';
  password: string;
}

const CUSTOMER_ACCOUNTS_KEY = 'gd-customer-accounts';

function loadCustomerAccounts(): StoredCustomerAccount[] {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredCustomerAccount[]) : [];
  } catch {
    return [];
  }
}

function saveCustomerAccounts(list: StoredCustomerAccount[]) {
  try {
    window.localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {
    // Abaikan jika localStorage penuh
  }
}

interface AccountViewProps {
  balance: number;
  orderCount: number;
  onSwitchTab: (tab: RootTab) => void;
  onOpenSedekah: () => void;
  onOpenPartner: (kind: 'umkm' | 'driver' | 'admin') => void;
}

const PARTNER_ROLES = [
  {
    key: 'umkm',
    label: 'Mitra Pedagang',
    desc: 'Kelola toko, menu/produk & terima pesanan pelanggan',
    icon: Store,
    tint: 'bg-[#FFF1E6] text-[#C4510A]',
  },
  {
    key: 'driver',
    label: 'Driver',
    desc: 'Kokpit peta, terima order, dompet, pendapatan & dokumen',
    icon: Bike,
    tint: 'bg-[#E6F6F3] text-[#0B7A6B]',
  },
  {
    key: 'admin',
    label: 'Superadmin',
    desc: 'Dashboard utama, pusat data pesanan, verifikasi driver & UMKM',
    icon: ShieldCheck,
    tint: 'bg-[#E0F2FE] text-[#0284C7]',
  },
] as const;

export function AccountView({
  balance,
  orderCount,
  onSwitchTab,
  onOpenSedekah,
  onOpenPartner,
}: AccountViewProps) {
  const [customerSession, setCustomerSession] =
    useLocalState<CustomerSession | null>('gd-customer-session', null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [nameInput, setNameInput] = useState('');
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleCustomerAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawId = identifierInput.trim();
    const normalizedId =
      loginMethod === 'phone'
        ? rawId.replace(/\s|-/g, '')
        : rawId.toLowerCase();

    if (loginMethod === 'phone') {
      if (normalizedId.length < 8) {
        setError('Masukkan Nomor HP / WhatsApp yang valid (minimal 8 digit).');
        return;
      }
    } else {
      if (!normalizedId.includes('@') || !normalizedId.includes('.')) {
        setError('Masukkan alamat Email yang valid (contoh: nama@email.com).');
        return;
      }
    }

    if (passwordInput.trim().length < 4) {
      setError('Password minimal 4 karakter.');
      return;
    }

    const accounts = loadCustomerAccounts();
    const defaultName =
      nameInput.trim() ||
      (loginMethod === 'email'
        ? normalizedId.split('@')[0]
        : `Pelanggan ${normalizedId.slice(-4)}`) ||
      'Pelanggan GoDrive';

    if (authMode === 'register') {
      if (!nameInput.trim()) {
        setError('Masukkan nama lengkap Anda.');
        return;
      }
      const record: StoredCustomerAccount = {
        name: nameInput.trim(),
        identifier: normalizedId,
        method: loginMethod,
        password: passwordInput.trim(),
      };
      const idx = accounts.findIndex((a) => a.identifier === normalizedId);
      if (idx >= 0) accounts[idx] = record;
      else accounts.push(record);
      saveCustomerAccounts(accounts);

      setCustomerSession({
        name: record.name,
        identifier: record.identifier,
        method: record.method,
        loggedInAt: Date.now(),
      });
      setPasswordInput('');
      return;
    }

    // Mode Login
    const found = accounts.find((a) => a.identifier === normalizedId);
    if (found) {
      if (found.password && found.password !== passwordInput.trim()) {
        setError('Password salah. Silakan coba lagi.');
        return;
      }
      setCustomerSession({
        name: found.name,
        identifier: found.identifier,
        method: found.method ?? loginMethod,
        loggedInAt: Date.now(),
      });
      setPasswordInput('');
      return;
    }

    // Jika belum terdaftar di perangkat ini, buat akun otomatis
    const newRecord: StoredCustomerAccount = {
      name: defaultName,
      identifier: normalizedId,
      method: loginMethod,
      password: passwordInput.trim(),
    };
    accounts.push(newRecord);
    saveCustomerAccounts(accounts);

    setCustomerSession({
      name: newRecord.name,
      identifier: newRecord.identifier,
      method: newRecord.method,
      loggedInAt: Date.now(),
    });
    setPasswordInput('');
  };

  const menus = [
    {
      label: 'Dompet JK Pay',
      desc: formatRupiah(balance),
      icon: Wallet,
      onClick: () => onSwitchTab('acc'),
    },
    {
      label: 'Riwayat Aktivitas',
      desc: `${orderCount} pesanan`,
      icon: ReceiptText,
      onClick: () => onSwitchTab('act'),
    },
    {
      label: 'Go Sedekah',
      desc: 'Berbagi untuk sesama',
      icon: HandHeart,
      onClick: onOpenSedekah,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Kartu Profil atau Form Login Pelanggan (Pilihan No. HP / Email + Password) */}
      {customerSession ? (
        <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-full bg-[#E6F6F3] text-[#0B7A6B] flex items-center justify-center shrink-0">
              <UserRound className="w-7 h-7" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#172124] truncate">
                  {customerSession.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F6F3] text-[#0B7A6B] text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Masuk
                </span>
              </div>
              <p className="text-xs text-[#5B676D] flex items-center gap-1.5 truncate">
                {customerSession.method === 'email' ? (
                  <Mail className="w-3.5 h-3.5 text-[#0F9D8A] shrink-0" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-[#0F9D8A] shrink-0" />
                )}
                <span className="truncate">{customerSession.identifier}</span>
              </p>
              <p className="text-[11px] text-[#6B7780] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Kahu, Kabupaten Bone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCustomerSession(null)}
            className="min-h-[38px] px-3.5 rounded-xl border border-[#E4E8EA] hover:bg-[#F5F7F7] text-xs font-semibold text-[#172124] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Akun
          </button>
        </section>
      ) : (
        <section className="bg-white border border-[#E4E8EA] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F6F3] text-[#0B7A6B] flex items-center justify-center shrink-0">
              <UserRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172124]">
                Login Akun Pelanggan
              </h2>
              <p className="text-xs text-[#5B676D]">
                Pilih masuk menggunakan Nomor HP atau Email beserta Password
              </p>
            </div>
          </div>

          {/* Tab Masuk / Daftar Baru */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#F5F7F7] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`min-h-[38px] rounded-lg text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-[#172124] shadow-xs'
                  : 'text-[#5B676D]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`min-h-[38px] rounded-lg text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-[#172124] shadow-xs'
                  : 'text-[#5B676D]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Daftar Baru
            </button>
          </div>

          {/* Pilihan Metode: Nomor HP atau Email */}
          <div>
            <span className="block text-xs font-semibold text-[#5B676D] mb-1.5">
              Masuk Menggunakan
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone');
                  setIdentifierInput('');
                  setError('');
                }}
                className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  loginMethod === 'phone'
                    ? 'border-[#0F9D8A] bg-[#E6F6F3] text-[#0B7A6B]'
                    : 'border-[#DCE2E4] bg-white text-[#5B676D] hover:bg-[#F5F7F7]'
                }`}
              >
                <Phone className="w-4 h-4" /> Nomor HP
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setIdentifierInput('');
                  setError('');
                }}
                className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  loginMethod === 'email'
                    ? 'border-[#0F9D8A] bg-[#E6F6F3] text-[#0B7A6B]'
                    : 'border-[#DCE2E4] bg-white text-[#5B676D] hover:bg-[#F5F7F7]'
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
            </div>
          </div>

          <form onSubmit={handleCustomerAuth} className="space-y-3">
            {authMode === 'register' && (
              <label className="block">
                <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                  Nama Lengkap Pelanggan
                </span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Andi Besse"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
              </label>
            )}

            {/* Kolom Nomor HP ATAU Email sesuai pilihan */}
            <label className="block">
              <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                {loginMethod === 'phone'
                  ? 'Nomor HP / WhatsApp'
                  : 'Alamat Email'}
              </span>
              <div className="relative">
                {loginMethod === 'phone' ? (
                  <Phone className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Mail className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  type={loginMethod === 'phone' ? 'tel' : 'email'}
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder={
                    loginMethod === 'phone'
                      ? '0812xxxxxxxx'
                      : 'nama@email.com'
                  }
                  className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
              </div>
            </label>

            {/* Kolom Password */}
            <label className="block">
              <span className="block text-xs font-semibold text-[#5B676D] mb-1">
                Password
              </span>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password (minimal 4 karakter)"
                  className="w-full min-h-[46px] pl-10 pr-10 rounded-xl border border-[#DCE2E4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Tampilkan password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7780] p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-sm font-bold cursor-pointer transition-colors"
              >
                {authMode === 'login'
                  ? `Masuk dengan ${loginMethod === 'phone' ? 'Nomor HP' : 'Email'}`
                  : 'Daftar & Masuk'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomerSession({
                    name: 'Pelanggan Kahu',
                    identifier:
                      loginMethod === 'phone'
                        ? '081241234567'
                        : 'pelanggan@godrive.id',
                    method: loginMethod,
                    loggedInAt: Date.now(),
                  })
                }
                className="min-h-[46px] px-4 rounded-xl bg-[#F5F7F7] hover:bg-[#EAEFEF] text-xs font-semibold text-[#172124] cursor-pointer"
              >
                Akun Demo
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white border border-[#E4E8EA] rounded-2xl divide-y divide-[#E4E8EA]">
        {menus.map(({ label, desc, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="w-full min-h-[56px] px-4 py-3 flex items-center gap-3 text-left cursor-pointer hover:bg-[#F5F7F7] transition-colors"
          >
            <Icon className="w-5 h-5 text-[#0F9D8A]" />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-[#172124]">
                {label}
              </span>
              <span className="block text-xs text-[#5B676D]">{desc}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#9AA5AA]" />
          </button>
        ))}
      </section>

      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-semibold text-[#5B676D]">
          Masuk sebagai Mitra / Superadmin
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PARTNER_ROLES.map(({ key, label, desc, icon: Icon, tint }) => (
            <button
              key={key}
              type="button"
              onClick={() => onOpenPartner(key)}
              className="min-h-[72px] p-3.5 rounded-2xl border border-[#E4E8EA] hover:bg-[#F5F7F7] flex items-center gap-3 text-left cursor-pointer transition-colors"
            >
              <div
                className={`w-11 h-11 rounded-xl ${tint} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172124]">{label}</p>
                <p className="text-xs text-[#5B676D]">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9AA5AA] shrink-0" />
            </button>
          ))}
        </div>
      </section>

      <PWAInstallButton />
    </div>
  );
}
