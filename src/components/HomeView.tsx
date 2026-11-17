import { ArrowRight, MapPin, Tag, Wallet, HeartHandshake, Clock } from 'lucide-react';
import {
  SERVICES,
  SERVICE_CENTER,
  SERVICE_RADIUS_KM,
  formatRupiah,
  type OrderRecord,
  type RootTab,
  type ServiceId,
} from '../data/jalanKitaData';
import { ServiceIcon } from './ServiceIcon';
import { PWAInstallButton } from './PWAControls';

interface HomeViewProps {
  wallet: number;
  giving: number;
  firstDeliveryPromoAvailable: boolean;
  activeOrders: OrderRecord[];
  onSelectService: (id: ServiceId) => void;
  onSwitchTab: (tab: RootTab) => void;
  onTrackOrder: (orderId: number) => void;
}

export function HomeView({
  wallet,
  giving,
  firstDeliveryPromoAvailable,
  activeOrders,
  onSelectService,
  onSwitchTab,
  onTrackOrder,
}: HomeViewProps) {
  const latestActive = activeOrders[0];

  return (
    <div className="space-y-6">
      {/* Top Hero + Wallet Split on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Hero Canvas */}
        <section className="lg:col-span-8 bg-gradient-to-br from-[#0F9D8A] to-[#0B7A6B] text-white rounded-2xl lg:rounded-3xl p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/85">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                Area layanan · Radius {SERVICE_RADIUS_KM} km dari {SERVICE_CENTER}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              GoDrive
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-lg">
              Transportasi harian, pesan makanan hangat, belanja kebutuhan, kirim barang, hingga berbagi sedekah di sekitar Kahu.
            </p>
            <PWAInstallButton variant="hero" className="mt-2" />
          </div>

          {/* Mobile inline wallet bridge */}
          <div className="mt-6 lg:hidden bg-white text-[#172124] rounded-2xl p-4 flex items-center justify-between gap-3 border border-[#E4E8EA]">
            <div>
              <div className="text-xs text-[#5B676D]">Saldo JK Pay</div>
              <div className="text-xl font-bold font-num mt-0.5">
                {formatRupiah(wallet)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab('acc')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] active:scale-[0.98] text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Isi Saldo
            </button>
          </div>
        </section>

        {/* Desktop Wallet Card */}
        <aside className="hidden lg:flex lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E4E8EA] flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-sm text-[#5B676D]">
              <span>Dompet JK Pay</span>
              <Wallet className="w-4 h-4 text-[#0F9D8A]" />
            </div>
            <div className="text-3xl font-bold font-num text-[#172124] mt-2">
              {formatRupiah(wallet)}
            </div>
            <p className="text-xs text-[#5B676D] mt-2 leading-relaxed">
              Pembayaran cepat untuk seluruh layanan di wilayah Kahu &amp; sekitarnya.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[#ECEFEF] flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSwitchTab('acc')}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Isi Saldo
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('act')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F2F5F5] hover:bg-[#E6ECEB] text-[#172124] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Riwayat
            </button>
          </div>
        </aside>
      </div>

      {/* Active Order Shortcut if any */}
      {latestActive && (
        <button
          type="button"
          onClick={() => onTrackOrder(latestActive.id)}
          className="w-full text-left bg-white hover:bg-[#FAFDFC] rounded-2xl p-4 border border-[#CBE5DF] flex items-center justify-between gap-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#0B7A6B]">
                Pesanan sedang berjalan · {latestActive.steps[Math.min(latestActive.step, latestActive.steps.length - 1)]}
              </div>
              <div className="text-sm font-semibold text-[#172124] truncate mt-0.5">
                {latestActive.label}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B7A6B] whitespace-nowrap shrink-0">
            Pantau <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}

      {/* 6 Core Services Grid */}
      <section aria-labelledby="services-heading">
        <div className="flex items-baseline justify-between mb-3">
          <h2 id="services-heading" className="text-base sm:text-lg font-bold text-[#172124]">
            Pilih Layanan
          </h2>
          <span className="text-xs text-[#5B676D]">6 layanan aktif</span>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {SERVICES.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelectService(svc.id)}
              className="group bg-white hover:bg-[#FAFDFC] active:scale-[0.98] rounded-2xl p-3.5 sm:p-4 border border-[#E4E8EA] hover:border-[#0F9D8A]/50 flex flex-col items-center text-center gap-2.5 transition-all cursor-pointer min-h-[108px]"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${svc.tintBg} ${svc.tintText} flex items-center justify-center transition-transform group-hover:scale-105`}
              >
                <ServiceIcon id={svc.id} className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#172124] whitespace-nowrap">
                  {svc.name}
                </div>
                <div className="hidden sm:block text-[11px] text-[#6B7780] mt-0.5 line-clamp-1">
                  {svc.tagline}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom 2-Column Info Strip: Promo + Sedekahmu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Promo Banner */}
        <section className="bg-gradient-to-br from-[#FF7A1A] to-[#F39C34] text-white rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <Tag className="w-4 h-4" />
              <span>{firstDeliveryPromoAvailable ? 'Promo tersedia hari ini' : 'Promo sudah digunakan'}</span>
            </div>
            <h3 className="text-lg font-bold leading-snug text-balance">
              Diskon 50% ongkir pertama!
            </h3>
            <p className="text-sm text-white/90">
              {firstDeliveryPromoAvailable
                ? 'Otomatis berlaku untuk pesanan Go Food atau Go Shop pertamamu hari ini.'
                : 'Terima kasih! Promo ongkir pertama sudah berhasil diterapkan pada pesananmu.'}
            </p>
          </div>
          {firstDeliveryPromoAvailable && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectService('food')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-[#C4510A] hover:bg-white/90 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Pesan Go Food
              </button>
              <button
                type="button"
                onClick={() => onSelectService('shop')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Belanja Go Shop
              </button>
            </div>
          )}
        </section>

        {/* Sedekah Summary Card */}
        <section className="bg-white rounded-2xl p-5 border border-[#E4E8EA] flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs text-[#5B676D]">Sedekahmu lewat aplikasi</div>
              <div className="text-2xl font-bold font-num text-[#172124]">
                {formatRupiah(giving)}
              </div>
              <p className="text-xs text-[#5B676D] leading-relaxed">
                Salurkan donasi langsung ke program pangan, air bersih, dan pendidikan warga lokal.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EAF6E1] text-[#2D6E1E] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onSelectService('sedekah')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3F5F2] hover:bg-[#D2EFEA] text-[#0B7A6B] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Berbagi Sekarang
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
