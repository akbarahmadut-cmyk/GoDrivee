import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bike,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatRupiah,
  type OrderRecord,
  type SedekahCampaign,
} from '../data/jalanKitaData';
import { useLocalState } from '../hooks/useLocalState';
import {
  COMMISSION_RATE,
  EMPTY_REGISTRATION,
  commissionOf,
  formatTime,
  type DriverJob,
  type Registration,
  type Review,
  type VehicleType,
  type WalletTx,
} from './driver/driverData';

interface AdminSession {
  username: string;
  loggedInAt: number;
}

interface UmkmProduct {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface UmkmOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: 'baru' | 'diproses' | 'siap' | 'selesai';
}

interface UmkmStoreProfile {
  name: string;
  category: string;
  phone: string;
  open: boolean;
}

export interface ManagedDriver {
  id: string;
  name: string;
  phone: string;
  pin: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  plate: string;
  verified: boolean;
  online: boolean;
  createdAt: number;
}

export interface ManagedMerchant {
  id: string;
  name: string;
  category: string;
  phone: string;
  pin: string;
  open: boolean;
  createdAt: number;
}

const DEFAULT_MANAGED_DRIVERS: ManagedDriver[] = [
  {
    id: 'drv-1',
    name: 'Pak Arman',
    phone: '08124100111',
    pin: '1234',
    vehicleType: 'Motor',
    vehicleModel: 'Honda Beat',
    plate: 'DW 2418 KH',
    verified: true,
    online: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'drv-2',
    name: 'Daeng Baso',
    phone: '08124100222',
    pin: '1234',
    vehicleType: 'Mobil',
    vehicleModel: 'Toyota Avanza',
    plate: 'DW 1184 BN',
    verified: true,
    online: false,
    createdAt: Date.now() - 86400000 * 2,
  },
];

const DEFAULT_MANAGED_MERCHANTS: ManagedMerchant[] = [
  {
    id: 'umkm-1',
    name: 'Warung Kahu',
    category: 'Makanan & Minuman',
    phone: '081234567890',
    pin: '1234',
    open: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'umkm-2',
    name: 'RM Pesona Kampung',
    category: 'Kuliner Tradisional',
    phone: '081298765432',
    pin: '1234',
    open: true,
    createdAt: Date.now() - 86400000 * 2,
  },
];

function upsertPartnerAuthAccount(
  role: 'driver' | 'umkm',
  record: { name: string; phone: string; pin: string }
) {
  try {
    const key = `gd-partner-accounts-${role}`;
    const raw = window.localStorage.getItem(key);
    const list: { name: string; phone: string; pin: string }[] = raw
      ? JSON.parse(raw)
      : [];
    const cleanPhone = record.phone.replace(/\s|-/g, '').trim();
    const idx = list.findIndex((a) => a.phone === cleanPhone);
    const entry = {
      name: record.name.trim(),
      phone: cleanPhone,
      pin: record.pin.trim(),
    };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Abaikan jika storage penuh.
  }
}

interface SuperAdminAppProps {
  customerOrders: OrderRecord[];
  customerWallet: number;
  givingTotal: number;
  campaigns: SedekahCampaign[];
  onBack: () => void;
}

type AdminTab = 'dashboard' | 'orders' | 'drivers' | 'merchants' | 'finance';

export default function SuperAdminApp({
  customerOrders,
  customerWallet,
  givingTotal,
  campaigns,
  onBack,
}: SuperAdminAppProps) {
  const [session, setSession] = useLocalState<AdminSession | null>(
    'gd-admin-session',
    null
  );
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  // Data real dari localStorage Driver & UMKM
  const [driverOnline, setDriverOnline] = useLocalState('gd-drv-online', false);
  const [driverReg, setDriverReg] = useLocalState<Registration>(
    'gd-drv-reg',
    EMPTY_REGISTRATION
  );
  const [driverActive, setDriverActive] = useLocalState<DriverJob | null>(
    'gd-drv-active',
    null
  );
  const [driverHistory, setDriverHistory] = useLocalState<DriverJob[]>(
    'gd-drv-history',
    []
  );
  const [driverBalance, setDriverBalance] = useLocalState<number>(
    'gd-drv-balance',
    50000
  );
  const [driverTxs, setDriverTxs] = useLocalState<WalletTx[]>('gd-drv-txs', []);
  const [driverReviews] = useLocalState<Review[]>('gd-drv-reviews', []);

  const [umkmStore, setUmkmStore] = useLocalState<UmkmStoreProfile>(
    'gd-umkm-store',
    {
      name: 'Warung Kahu',
      category: 'Makanan & Minuman',
      phone: '081234567890',
      open: false,
    }
  );
  const [umkmProducts, setUmkmProducts] = useLocalState<UmkmProduct[]>(
    'gd-umkm-products',
    []
  );
  const [umkmOrders] = useLocalState<UmkmOrder[]>('gd-umkm-orders', []);

  // Daftar semua Driver & Pedagang yang dikelola Superadmin
  const [managedDrivers, setManagedDrivers] = useLocalState<ManagedDriver[]>(
    'gd-admin-drivers',
    DEFAULT_MANAGED_DRIVERS
  );
  const [managedMerchants, setManagedMerchants] = useLocalState<
    ManagedMerchant[]
  >('gd-admin-merchants', DEFAULT_MANAGED_MERCHANTS);

  // State form tambah Driver baru
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvPin, setDrvPin] = useState('1234');
  const [drvVehicleType, setDrvVehicleType] = useState<VehicleType>('Motor');
  const [drvVehicleModel, setDrvVehicleModel] = useState('');
  const [drvPlate, setDrvPlate] = useState('');

  // State form tambah Pedagang baru
  const [mrcName, setMrcName] = useState('');
  const [mrcCategory, setMrcCategory] = useState('Makanan & Minuman');
  const [mrcPhone, setMrcPhone] = useState('');
  const [mrcPin, setMrcPin] = useState('1234');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  if (!session) {
    return (
      <SuperAdminLoginView
        onBack={onBack}
        onSuccess={(s) => setSession(s)}
      />
    );
  }

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = drvPhone.replace(/\s|-/g, '').trim();
    if (!drvName.trim() || cleanPhone.length < 8 || !drvPlate.trim()) {
      showToast('Lengkapi Nama, No. HP (min 8 digit), dan Plat Nomor driver.');
      return;
    }
    if (drvPin.trim().length < 4) {
      showToast('PIN login driver minimal 4 karakter.');
      return;
    }
    const newDrv: ManagedDriver = {
      id: `drv-${Date.now()}`,
      name: drvName.trim(),
      phone: cleanPhone,
      pin: drvPin.trim(),
      vehicleType: drvVehicleType,
      vehicleModel: drvVehicleModel.trim() || (drvVehicleType === 'Motor' ? 'Honda Beat' : 'Toyota Avanza'),
      plate: drvPlate.trim().toUpperCase(),
      verified: true,
      online: true,
      createdAt: Date.now(),
    };
    setManagedDrivers((prev) => [newDrv, ...prev]);

    // Daftarkan juga ke akun login Driver & profil aktif agar bisa langsung dipakai login
    upsertPartnerAuthAccount('driver', {
      name: newDrv.name,
      phone: newDrv.phone,
      pin: newDrv.pin,
    });
    setDriverReg({
      ...driverReg,
      name: newDrv.name,
      phone: newDrv.phone,
      vehicleType: newDrv.vehicleType,
      vehicleModel: newDrv.vehicleModel,
      plate: newDrv.plate,
      docs: {
        ktp: 'ktp-admin-verified.jpg',
        sim: 'sim-admin-verified.jpg',
        stnk: 'stnk-admin-verified.jpg',
      },
      status: 'verified',
    });

    setDrvName('');
    setDrvPhone('');
    setDrvVehicleModel('');
    setDrvPlate('');
    showToast(`Driver "${newDrv.name}" ditambahkan & siap login dengan No. HP ${newDrv.phone}!`);
  };

  const handleAddMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mrcPhone.replace(/\s|-/g, '').trim();
    if (!mrcName.trim() || cleanPhone.length < 8) {
      showToast('Lengkapi Nama Toko/Pedagang dan No. HP (min 8 digit).');
      return;
    }
    if (mrcPin.trim().length < 4) {
      showToast('PIN login pedagang minimal 4 karakter.');
      return;
    }
    const newMrc: ManagedMerchant = {
      id: `umkm-${Date.now()}`,
      name: mrcName.trim(),
      category: mrcCategory.trim() || 'Makanan & Minuman',
      phone: cleanPhone,
      pin: mrcPin.trim(),
      open: true,
      createdAt: Date.now(),
    };
    setManagedMerchants((prev) => [newMrc, ...prev]);

    // Daftarkan juga ke akun login Mitra Pedagang & profil toko aktif
    upsertPartnerAuthAccount('umkm', {
      name: newMrc.name,
      phone: newMrc.phone,
      pin: newMrc.pin,
    });
    setUmkmStore({
      name: newMrc.name,
      category: newMrc.category,
      phone: newMrc.phone,
      open: true,
    });

    setMrcName('');
    setMrcPhone('');
    showToast(`Pedagang "${newMrc.name}" ditambahkan & siap login dengan No. HP ${newMrc.phone}!`);
  };

  // Perhitungan metrik gabungan
  const totalCustomerGmv = customerOrders.reduce((s, o) => s + o.amt, 0);
  const totalDriverGmv = driverHistory.reduce((s, j) => s + j.fare, 0);
  const totalUmkmGmv = umkmOrders.reduce((s, o) => s + o.total, 0);
  const totalPlatformGmv = totalCustomerGmv + totalDriverGmv + totalUmkmGmv;
  const totalCommissionRevenue =
    driverHistory.reduce((s, j) => s + commissionOf(j.fare), 0) +
    Math.round((totalCustomerGmv + totalUmkmGmv) * COMMISSION_RATE);

  const avgDriverRating =
    driverReviews.length === 0
      ? 5.0
      : Math.round(
          (driverReviews.reduce((s, r) => s + r.rating, 0) /
            driverReviews.length) *
            10
        ) / 10;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F7]">
      {/* Top Bar Superadmin */}
      <header className="sticky top-0 z-30 bg-[#0F172A] text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[36px] px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Aplikasi
            </button>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                GoDrive Superadmin
              </h1>
              <p className="text-[11px] text-white/60 leading-none">
                Pusat Data & Kontrol Operasional Kahu, Bone
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] text-xs font-bold">
              {session.username}
            </span>
            <button
              type="button"
              onClick={() => setSession(null)}
              className="min-h-[36px] px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigasi Desktop & Mobile */}
      <div className="bg-white border-b border-[#E4E8EA] sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto py-2">
          {(
            [
              ['dashboard', 'Dashboard', BarChart3],
              ['drivers', `Driver (${managedDrivers.length})`, Bike],
              ['merchants', `Pedagang (${managedMerchants.length})`, Store],
              ['orders', 'Data Pesanan', ClipboardList],
              ['finance', 'Keuangan & Sedekah', Wallet],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#5B676D] hover:bg-[#F5F7F7]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 space-y-5">
        {tab === 'dashboard' && (
          <>
            {/* Ringkasan KPI Utama */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#0F172A] text-white rounded-2xl p-4 space-y-1">
                <span className="text-xs text-white/70">Total Transaksi (GMV)</span>
                <p className="text-xl font-bold font-num">
                  {formatRupiah(totalPlatformGmv)}
                </p>
                <p className="text-[11px] text-[#38BDF8]">
                  Komisi Platform: {formatRupiah(totalCommissionRevenue)}
                </p>
              </div>

              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-1">
                <span className="text-xs text-[#5B676D]">Total Semua Pesanan</span>
                <p className="text-xl font-bold font-num text-[#172124]">
                  {customerOrders.length + driverHistory.length + umkmOrders.length}
                </p>
                <p className="text-[11px] text-[#5B676D]">
                  Pelanggan: {customerOrders.length} · Driver: {driverHistory.length} · UMKM: {umkmOrders.length}
                </p>
              </div>

              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-1">
                <span className="text-xs text-[#5B676D]">Total Mitra Driver</span>
                <p className="text-xl font-bold font-num text-[#172124]">
                  {managedDrivers.length} Driver
                </p>
                <p className="text-[11px] text-[#0B7A6B] font-medium">
                  {managedDrivers.filter((d) => d.verified).length} Terverifikasi · ★{avgDriverRating}
                </p>
              </div>

              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-1">
                <span className="text-xs text-[#5B676D]">Total Mitra Pedagang</span>
                <p className="text-xl font-bold font-num text-[#172124]">
                  {managedMerchants.length} Toko
                </p>
                <p className="text-[11px] text-[#C4510A] font-medium">
                  {managedMerchants.filter((m) => m.open).length} Buka · {umkmProducts.length} Produk
                </p>
              </div>
            </div>

            {/* Pintasan Tambah Driver & Tambah Pedagang */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#172124]">
                  Manajemen Mitra & Kontrol Cepat
                </h2>
                <span className="text-xs text-[#5B676D]">
                  Tambah akun baru atau kelola status mitra
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTab('drivers')}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>+ Tambah Mitra Driver</span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setTab('merchants')}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>+ Tambah Mitra Pedagang</span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStatus =
                      driverReg.status === 'verified' ? 'pending' : 'verified';
                    setDriverReg({
                      ...driverReg,
                      name: driverReg.name || 'Andi Saputra (Driver)',
                      plate: driverReg.plate || 'DD 4521 KHU',
                      status: nextStatus,
                    });
                    showToast(
                      nextStatus === 'verified'
                        ? 'Akun Driver disetujui (Terverifikasi)!'
                        : 'Status Driver diubah ke Menunggu.'
                    );
                  }}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#E6F6F3] text-[#0B7A6B] text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {driverReg.status === 'verified'
                      ? 'Cabut Verifikasi Driver'
                      : 'Setujui Verifikasi Driver'}
                  </span>
                  <UserCheck className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUmkmStore({ ...umkmStore, open: !umkmStore.open });
                    showToast(
                      !umkmStore.open
                        ? `Toko ${umkmStore.name} dibuka.`
                        : `Toko ${umkmStore.name} ditutup.`
                    );
                  }}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#FFF1E6] text-[#C4510A] text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {umkmStore.open ? 'Tutup Toko UMKM' : 'Buka Toko UMKM'}
                  </span>
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Ringkasan Data 3 Ekosistem */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#0F9D8A]" /> Data Pelanggan
                  </h3>
                  <span className="text-xs font-num font-bold text-[#0B7A6B]">
                    Saldo {formatRupiah(customerWallet)}
                  </span>
                </div>
                <p className="text-xs text-[#5B676D]">
                  Total pesanan pelanggan: <b>{customerOrders.length}</b> · Total sedekah: <b>{formatRupiah(givingTotal)}</b>
                </p>
                {customerOrders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="text-xs border-t border-[#F0F3F4] pt-2 flex items-center justify-between"
                  >
                    <span className="font-semibold truncate max-w-[65%]">
                      {o.label}
                    </span>
                    <span className="font-num font-bold">
                      {formatRupiah(o.amt)}
                    </span>
                  </div>
                ))}
              </section>

              <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-[#0F9D8A]" /> Mitra Driver ({managedDrivers.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTab('drivers')}
                    className="text-xs font-bold text-[#0B7A6B] hover:underline cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
                {managedDrivers.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className="text-xs border-t border-[#F0F3F4] pt-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-[#5B676D]">
                        {d.vehicleType} · {d.plate}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.verified
                          ? 'bg-[#E6F6F3] text-[#0B7A6B]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.verified ? 'Aktif' : 'Pending'}
                    </span>
                  </div>
                ))}
              </section>

              <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#C4510A]" /> Mitra Pedagang ({managedMerchants.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTab('merchants')}
                    className="text-xs font-bold text-[#C4510A] hover:underline cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
                {managedMerchants.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="text-xs border-t border-[#F0F3F4] pt-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-[#5B676D]">{m.category}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.open
                          ? 'bg-[#E6F6F3] text-[#0B7A6B]'
                          : 'bg-[#FFF1E6] text-[#C4510A]'
                      }`}
                    >
                      {m.open ? 'Buka' : 'Tutup'}
                    </span>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}

        {tab === 'drivers' && (
          <div className="space-y-4">
            {/* Form Tambah Driver Baru oleh Superadmin */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#172124]">
                    + Tambah Mitra Driver Baru
                  </h2>
                  <p className="text-xs text-[#5B676D]">
                    Driver yang ditambahkan otomatis terverifikasi dan langsung bisa login di halaman Driver
                  </p>
                </div>
                <Bike className="w-5 h-5 text-[#0F9D8A]" />
              </div>

              <form onSubmit={handleAddDriver} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Nama Lengkap Driver
                    </span>
                    <input
                      type="text"
                      value={drvName}
                      onChange={(e) => setDrvName(e.target.value)}
                      placeholder="Contoh: Pak Burhan"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Nomor HP / WhatsApp (Untuk Login)
                    </span>
                    <input
                      type="tel"
                      value={drvPhone}
                      onChange={(e) => setDrvPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Jenis Kendaraan
                    </span>
                    <select
                      value={drvVehicleType}
                      onChange={(e) =>
                        setDrvVehicleType(e.target.value as VehicleType)
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] bg-white text-sm"
                    >
                      <option value="Motor">Motor (Go Ride / Food / Pickup)</option>
                      <option value="Mobil">Mobil (Go Car / Pickup)</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Merk / Tipe Kendaraan
                    </span>
                    <input
                      type="text"
                      value={drvVehicleModel}
                      onChange={(e) => setDrvVehicleModel(e.target.value)}
                      placeholder="Contoh: Honda Vario 160"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Plat Nomor Kendaraan
                    </span>
                    <input
                      type="text"
                      value={drvPlate}
                      onChange={(e) => setDrvPlate(e.target.value)}
                      placeholder="Contoh: DW 4321 KH"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      PIN / Password Login Driver
                    </span>
                    <input
                      type="text"
                      value={drvPin}
                      onChange={(e) => setDrvPin(e.target.value)}
                      placeholder="1234"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Simpan & Daftarkan Driver
                </button>
              </form>
            </section>

            {/* Daftar Semua Mitra Driver Terdaftar */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold">
                Daftar Mitra Driver Terdaftar ({managedDrivers.length})
              </h2>
              {managedDrivers.length === 0 ? (
                <p className="text-xs text-[#5B676D]">
                  Belum ada mitra driver terdaftar.
                </p>
              ) : (
                <div className="divide-y divide-[#F0F3F4]">
                  {managedDrivers.map((d) => (
                    <div
                      key={d.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#172124]">
                            {d.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.verified
                                ? 'bg-[#E6F6F3] text-[#0B7A6B]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.verified ? 'Terverifikasi' : 'Menunggu'}
                          </span>
                        </div>
                        <p className="text-[#5B676D]">
                          {d.vehicleType} · {d.vehicleModel} ({d.plate})
                        </p>
                        <p className="text-[#9AA5AA] font-mono">
                          Login HP: {d.phone} · PIN: {d.pin}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDriverReg({
                              ...driverReg,
                              name: d.name,
                              phone: d.phone,
                              vehicleType: d.vehicleType,
                              vehicleModel: d.vehicleModel,
                              plate: d.plate,
                              docs: {
                                ktp: 'ktp-verified.jpg',
                                sim: 'sim-verified.jpg',
                                stnk: 'stnk-verified.jpg',
                              },
                              status: d.verified ? 'verified' : 'pending',
                            });
                            setDriverOnline(d.online);
                            showToast(`Driver "${d.name}" dijadikan profil aktif di Kokpit Driver.`);
                          }}
                          className="min-h-[34px] px-3 rounded-lg bg-[#E6F6F3] text-[#0B7A6B] font-bold cursor-pointer"
                        >
                          Jadikan Aktif
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setManagedDrivers((prev) =>
                              prev.map((x) =>
                                x.id === d.id
                                  ? { ...x, verified: !x.verified }
                                  : x
                              )
                            )
                          }
                          className="min-h-[34px] px-3 rounded-lg border border-[#E4E8EA] font-semibold cursor-pointer"
                        >
                          {d.verified ? 'Nonaktifkan' : 'Verifikasi'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManagedDrivers((prev) =>
                              prev.filter((x) => x.id !== d.id)
                            );
                            showToast(`Driver ${d.name} dihapus.`);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Profil Driver yang Sedang Aktif di Kokpit */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Akun Kokpit Driver Aktif Saat Ini
                  </h2>
                  <p className="text-xs text-[#5B676D]">
                    {driverReg.name || 'Belum diisi'} · {driverReg.vehicleType} ({driverReg.plate || '-'})
                  </p>
                </div>
                {driverReg.status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F6F3] text-[#0B7A6B] text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF6E5] text-[#B86E00] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" /> {driverReg.status}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDriverBalance((b) => b + 50000);
                    setDriverTxs((t) => [
                      {
                        id: `adm-${Date.now()}`,
                        kind: 'earning',
                        amount: 50000,
                        label: 'Bonus / Top Up dari Superadmin',
                        time: Date.now(),
                      },
                      ...t,
                    ]);
                    showToast('Saldo dompet driver ditambah Rp50.000.');
                  }}
                  className="min-h-[38px] px-3.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
                >
                  + Tambah Saldo Driver Rp50.000
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === 'merchants' && (
          <div className="space-y-4">
            {/* Form Tambah Mitra Pedagang (UMKM) Baru */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#172124]">
                    + Tambah Mitra Pedagang (UMKM) Baru
                  </h2>
                  <p className="text-xs text-[#5B676D]">
                    Pedagang yang ditambahkan langsung terdaftar dan bisa login di halaman Mitra Pedagang
                  </p>
                </div>
                <Store className="w-5 h-5 text-[#C4510A]" />
              </div>

              <form onSubmit={handleAddMerchant} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Nama Toko / Warung / Usaha
                    </span>
                    <input
                      type="text"
                      value={mrcName}
                      onChange={(e) => setMrcName(e.target.value)}
                      placeholder="Contoh: Bakso & Es Teler Palattae"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Kategori Usaha
                    </span>
                    <input
                      type="text"
                      value={mrcCategory}
                      onChange={(e) => setMrcCategory(e.target.value)}
                      placeholder="Makanan & Minuman / Sembako"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      Nomor HP / WhatsApp (Untuk Login)
                    </span>
                    <input
                      type="tel"
                      value={mrcPhone}
                      onChange={(e) => setMrcPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#5B676D] mb-1">
                      PIN / Password Login Pedagang
                    </span>
                    <input
                      type="text"
                      value={mrcPin}
                      onChange={(e) => setMrcPin(e.target.value)}
                      placeholder="1234"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-sm"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Simpan & Daftarkan Pedagang
                </button>
              </form>
            </section>

            {/* Daftar Semua Mitra Pedagang Terdaftar */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold">
                Daftar Mitra Pedagang Terdaftar ({managedMerchants.length})
              </h2>
              {managedMerchants.length === 0 ? (
                <p className="text-xs text-[#5B676D]">
                  Belum ada mitra pedagang terdaftar.
                </p>
              ) : (
                <div className="divide-y divide-[#F0F3F4]">
                  {managedMerchants.map((m) => (
                    <div
                      key={m.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#172124]">
                            {m.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.open
                                ? 'bg-[#E6F6F3] text-[#0B7A6B]'
                                : 'bg-[#FFF1E6] text-[#C4510A]'
                            }`}
                          >
                            {m.open ? 'Buka' : 'Tutup'}
                          </span>
                        </div>
                        <p className="text-[#5B676D]">{m.category}</p>
                        <p className="text-[#9AA5AA] font-mono">
                          Login HP: {m.phone} · PIN: {m.pin}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUmkmStore({
                              name: m.name,
                              category: m.category,
                              phone: m.phone,
                              open: m.open,
                            });
                            showToast(`Toko "${m.name}" dijadikan toko aktif.`);
                          }}
                          className="min-h-[34px] px-3 rounded-lg bg-[#FFF1E6] text-[#C4510A] font-bold cursor-pointer"
                        >
                          Jadikan Aktif
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setManagedMerchants((prev) =>
                              prev.map((x) =>
                                x.id === m.id ? { ...x, open: !x.open } : x
                              )
                            )
                          }
                          className="min-h-[34px] px-3 rounded-lg border border-[#E4E8EA] font-semibold cursor-pointer"
                        >
                          {m.open ? 'Tutup Toko' : 'Buka Toko'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManagedMerchants((prev) =>
                              prev.filter((x) => x.id !== m.id)
                            );
                            showToast(`Pedagang ${m.name} dihapus.`);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Produk di Toko Aktif */}
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Produk Toko Aktif: {umkmStore.name} ({umkmProducts.length})
                  </h2>
                  <p className="text-xs text-[#5B676D]">
                    {umkmStore.category} · Telp: {umkmStore.phone || '-'}
                  </p>
                </div>
              </div>
              {umkmProducts.length === 0 ? (
                <p className="text-xs text-[#5B676D]">Belum ada produk.</p>
              ) : (
                umkmProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-[#F0F3F4] pb-2 last:border-0 text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="font-num text-[#5B676D]">
                        {formatRupiah(p.price)} ·{' '}
                        {p.available ? 'Tersedia' : 'Habis'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUmkmProducts((prev) =>
                          prev.filter((x) => x.id !== p.id)
                        );
                        showToast(`Produk ${p.name} dihapus.`);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold">
                Pesanan dari Aplikasi Pelanggan ({customerOrders.length})
              </h2>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-[#5B676D]">
                  Belum ada pesanan dari aplikasi pelanggan di sesi ini.
                </p>
              ) : (
                customerOrders.map((o) => (
                  <div
                    key={o.id}
                    className="border-b border-[#F0F3F4] pb-2.5 last:border-0 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#172124]">
                        {o.id} · {o.label}
                      </p>
                      <p className="text-[#5B676D]">{o.extra?.detail ?? o.time}</p>
                      <p className="text-[#9AA5AA]">
                        Driver: {o.drv[0]} ({o.drv[1]}) · Status:{' '}
                        {o.steps[Math.min(o.step, o.steps.length - 1)]}
                      </p>
                    </div>
                    <span className="font-num font-bold text-sm text-[#0B7A6B]">
                      {formatRupiah(o.amt)}
                    </span>
                  </div>
                ))
              )}
            </section>

            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  Riwayat Order Mitra Driver ({driverHistory.length})
                </h2>
                {driverHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDriverHistory([]);
                      showToast('Riwayat order driver dibersihkan.');
                    }}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
              {driverActive && (
                <div className="rounded-xl bg-[#E6F6F3] p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0B7A6B]">
                      SEDANG BERJALAN: {driverActive.service}
                    </span>
                    <p className="text-[#172124]">
                      {driverActive.pickup.label} → {driverActive.dropoff.label} ({driverActive.customer.name})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDriverActive(null);
                      showToast('Order aktif driver dibatalkan oleh Superadmin.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                  >
                    Batalkan
                  </button>
                </div>
              )}
              {driverHistory.length === 0 ? (
                <p className="text-xs text-[#5B676D]">
                  Belum ada riwayat order driver selesai.
                </p>
              ) : (
                driverHistory.map((j) => (
                  <div
                    key={j.id}
                    className="border-b border-[#F0F3F4] pb-2 last:border-0 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm">
                        {j.service} · {j.customer.name} ({j.payment})
                      </p>
                      <p className="text-[#5B676D]">
                        {j.pickup.label} → {j.dropoff.label} ({j.distanceKm.toFixed(1)} km)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-num font-bold text-sm">
                        {formatRupiah(j.fare)}
                      </p>
                      <p className="text-[11px] text-[#0B7A6B]">
                        Komisi: {formatRupiah(commissionOf(j.fare))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold">
                Pesanan Toko UMKM ({umkmOrders.length})
              </h2>
              {umkmOrders.length === 0 ? (
                <p className="text-xs text-[#5B676D]">
                  Belum ada pesanan di toko UMKM.
                </p>
              ) : (
                umkmOrders.map((o) => (
                  <div
                    key={o.id}
                    className="border-b border-[#F0F3F4] pb-2 last:border-0 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm">{o.customer}</p>
                      <p className="text-[#5B676D]">{o.items}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-num font-bold text-sm">
                        {formatRupiah(o.total)}
                      </p>
                      <span className="uppercase text-[10px] font-bold text-[#C4510A]">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {tab === 'finance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4">
                <span className="text-xs text-[#5B676D]">
                  Pendapatan Komisi Platform ({COMMISSION_RATE * 100}%)
                </span>
                <p className="text-xl font-bold font-num text-[#0B7A6B] mt-1">
                  {formatRupiah(totalCommissionRevenue)}
                </p>
              </div>
              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4">
                <span className="text-xs text-[#5B676D]">
                  Saldo Dompet Pelanggan (JK Pay)
                </span>
                <p className="text-xl font-bold font-num text-[#172124] mt-1">
                  {formatRupiah(customerWallet)}
                </p>
              </div>
              <div className="bg-white border border-[#E4E8EA] rounded-2xl p-4">
                <span className="text-xs text-[#5B676D]">
                  Total Donasi Go Sedekah
                </span>
                <p className="text-xl font-bold font-num text-[#0B7A6B] mt-1">
                  {formatRupiah(
                    campaigns.reduce((s, c) => s + c.collected, 0)
                  )}
                </p>
              </div>
            </div>

            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
              <h2 className="text-sm font-bold">
                Mutasi Dompet Mitra Driver ({driverTxs.length})
              </h2>
              {driverTxs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs border-b border-[#F0F3F4] pb-2 last:border-0"
                >
                  <div>
                    <p className="font-semibold">{t.label}</p>
                    <p className="text-[#9AA5AA]">{formatTime(t.time)}</p>
                  </div>
                  <span
                    className={`font-num font-bold ${
                      t.amount >= 0 ? 'text-[#0B7A6B]' : 'text-red-600'
                    }`}
                  >
                    {t.amount >= 0 ? '+' : ''}
                    {formatRupiah(t.amount)}
                  </span>
                </div>
              ))}
            </section>

            <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
              <h2 className="text-sm font-bold">Data Kampanye Go Sedekah</h2>
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs border-b border-[#F0F3F4] pb-2 last:border-0"
                >
                  <div>
                    <p className="font-bold text-sm">{c.title}</p>
                    <p className="text-[#5B676D]">{c.organizer}</p>
                  </div>
                  <div className="text-right font-num">
                    <p className="font-bold text-[#0B7A6B]">
                      {formatRupiah(c.collected)}
                    </p>
                    <p className="text-[#9AA5AA]">
                      Target {formatRupiah(c.goal)}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 max-w-[90vw] px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function SuperAdminLoginView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (s: AdminSession) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.trim().length < 4) {
      setError('Masukkan username admin dan PIN/password (minimal 4 karakter).');
      return;
    }
    onSuccess({
      username: username.trim(),
      loggedInAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <header className="px-4 h-14 flex items-center justify-between border-b border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[38px] px-3 rounded-xl bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Akun
        </button>
        <span className="text-xs font-bold text-[#38BDF8]">
          Superadmin Portal
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1E293B] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Login Superadmin</h1>
              <p className="text-xs text-white/70">
                Dashboard & pusat data seluruh ekosistem GoDrive
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block">
              <span className="block text-xs font-semibold text-white/70 mb-1">
                Username / ID Admin
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#0F172A] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-white/70 mb-1">
                Kata Sandi / PIN Superadmin
              </span>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full min-h-[48px] pl-10 pr-10 rounded-xl bg-[#0F172A] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 p-1 cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-400/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl bg-[#38BDF8] text-[#0F172A] text-sm font-bold cursor-pointer"
            >
              Masuk ke Dashboard Superadmin
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              onSuccess({ username: 'Superadmin GoDrive', loggedInAt: Date.now() })
            }
            className="w-full min-h-[42px] rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
          >
            Masuk Cepat (Akun Demo Superadmin)
          </button>
        </div>
      </main>
    </div>
  );
}
