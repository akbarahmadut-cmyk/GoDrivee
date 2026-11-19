import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, LocateFixed, LogOut, Navigation, Star, UserCheck, Wallet } from 'lucide-react';
import type { LatLngPoint } from '../data/jalanKitaData';
import { useLocalState } from '../hooks/useLocalState';
import { useRealtimeGps } from '../hooks/useRealtimeGps';
import { useContext } from 'react';
import { MapsAvailabilityContext } from '../components/GoogleRouteMap';
import { PartnerMapsProvider } from './PartnerShell';
import { PartnerAuthView, type PartnerSession } from './PartnerAuthView';
import { DriverMap } from './driver/DriverMap';
import {
  ChatModal,
  CockpitSheet,
  DriverWalletPanel,
  EarningsPanel,
  OfferModal,
  ProfileAndDocsPanel,
} from './driver/DriverPanels';
import {
  EMPTY_REGISTRATION,
  KAHU_CENTER,
  MIN_WITHDRAW,
  commissionOf,
  generateJob,
  generateReview,
  randomCustomerReply,
  startOfDay,
  type DriverJob,
  type DriverSettings,
  type Registration,
  type Review,
  type WalletTx,
} from './driver/driverData';
import { useDriverSound } from './driver/useDriverSound';

type Tab = 'map' | 'earnings' | 'wallet' | 'profile';

export default function DriverApp({ onBack }: { onBack?: () => void }) {
  const parentMaps = useContext(MapsAvailabilityContext);
  const [session, setSession] = useLocalState<PartnerSession | null>('gd-drv-session', null);
  const [tab, setTab] = useState<Tab>('map');
  const [online, setOnline] = useLocalState('gd-drv-online', false);
  const [driverPos, setDriverPos] = useState<LatLngPoint>(KAHU_CENTER);
  const [liveGpsEnabled, setLiveGpsEnabled] = useLocalState('gd-drv-live-gps', true);
  const gps = useRealtimeGps(Boolean(session) && (online || liveGpsEnabled), (pt) => {
    setDriverPos(pt);
  });
  const [reg, setReg] = useLocalState<Registration>('gd-drv-reg', EMPTY_REGISTRATION);
  const [settings, setSettings] = useLocalState<DriverSettings>('gd-drv-settings', {
    sound: true,
    vibrate: true,
    autoOffers: true,
  });
  const [activeJob, setActiveJob] = useLocalState<DriverJob | null>('gd-drv-active', null);
  const [offer, setOffer] = useState<DriverJob | null>(null);
  const [history, setHistory] = useLocalState<DriverJob[]>('gd-drv-history', []);
  const [balance, setBalance] = useLocalState<number>('gd-drv-balance', 50000);
  const [txs, setTxs] = useLocalState<WalletTx[]>('gd-drv-txs', [
    { id: 'init', kind: 'initial', amount: 50000, label: 'Saldo awal mitra driver', time: Date.now() },
  ]);
  const [reviews, setReviews] = useLocalState<Review[]>('gd-drv-reviews', []);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { unlock, playAlert } = useDriverSound(settings.sound, settings.vibrate);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const triggerOffer = useCallback(() => {
    setOffer((curr) => {
      if (curr) return curr;
      const job = generateJob(driverPos, reg.vehicleType);
      playAlert();
      return job;
    });
  }, [driverPos, reg.vehicleType, playAlert]);

  // Saat online dan tidak sedang mengantar, kirim tawaran order berkala.
  useEffect(() => {
    if (!online || !settings.autoOffers || activeJob || offer) return;
    const id = window.setTimeout(triggerOffer, 9000);
    return () => window.clearTimeout(id);
  }, [online, settings.autoOffers, activeJob, offer, triggerOffer]);

  const toggleOnline = () => {
    unlock();
    if (!online && reg.status !== 'verified') {
      showToast('Selesaikan pendaftaran & verifikasi dokumen dulu.');
      setTab('profile');
      return;
    }
    setOnline(!online);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      showToast('Perangkat tidak mendukung GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setDriverPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        showToast('Lokasi GPS diperbarui.');
      },
      () => showToast('Izin lokasi ditolak, memakai pusat Kahu.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const advanceJob = () => {
    if (!activeJob) return;
    if (activeJob.phase === 'to_pickup') {
      setActiveJob({ ...activeJob, phase: 'to_dropoff' });
      setDriverPos(activeJob.pickup.coords);
      showToast('Penumpang / barang dijemput. Lanjut ke tujuan.');
      return;
    }
    // Selesai: hitung pendapatan & potongan komisi.
    const comm = commissionOf(activeJob.fare);
    const net = activeJob.fare - comm;
    const now = Date.now();
    const done: DriverJob = { ...activeJob, phase: 'done', completedAt: now };
    setHistory((h) => [done, ...h]);
    setDriverPos(activeJob.dropoff.coords);

    if (activeJob.payment === 'JK Pay') {
      setBalance((b) => b + net);
      setTxs((t) => [
        { id: `c${now}`, kind: 'commission', amount: -comm, label: `Komisi ${activeJob.service}`, time: now },
        { id: `e${now}`, kind: 'earning', amount: activeJob.fare, label: `Tarif ${activeJob.service} (JK Pay)`, time: now },
        ...t,
      ]);
    } else {
      setBalance((b) => b - comm);
      setTxs((t) => [
        { id: `c${now}`, kind: 'commission', amount: -comm, label: `Potongan komisi ${activeJob.service} (Tunai)`, time: now },
        ...t,
      ]);
    }
    const rev = generateReview(activeJob);
    setReviews((r) => [rev, ...r]);
    setActiveJob(null);
    showToast(`Order selesai! Bersih +Rp${net.toLocaleString('id-ID')} (★${rev.rating})`);
  };

  const sendChat = (text: string) => {
    if (!activeJob) return;
    const withDriver: DriverJob = {
      ...activeJob,
      chat: [...activeJob.chat, { from: 'driver', text, time: Date.now() }],
    };
    setActiveJob(withDriver);
    window.setTimeout(() => {
      setActiveJob((curr) =>
        curr && curr.id === withDriver.id
          ? {
              ...curr,
              chat: [...curr.chat, { from: 'customer', text: randomCustomerReply(), time: Date.now() }],
            }
          : curr
      );
    }, 1200);
  };

  const handleWithdraw = (amount: number, bank: string, acc: string) => {
    if (!bank.trim() || !acc.trim()) {
      showToast('Isi nama bank dan nomor rekening.');
      return;
    }
    if (amount < MIN_WITHDRAW) {
      showToast(`Minimal penarikan Rp${MIN_WITHDRAW.toLocaleString('id-ID')}.`);
      return;
    }
    if (amount > balance) {
      showToast('Saldo dompet tidak cukup.');
      return;
    }
    setBalance((b) => b - amount);
    setTxs((t) => [
      { id: `w${Date.now()}`, kind: 'withdraw', amount: -amount, label: `Tarik ke ${bank} ${acc}`, time: Date.now() },
      ...t,
    ]);
    showToast('Permintaan tarik dana berhasil diproses.');
  };

  const todayStart = startOfDay(Date.now());
  const todayJobs = history.filter((j) => (j.completedAt ?? 0) >= todayStart);
  const todayNet = todayJobs.reduce((s, j) => s + j.fare - commissionOf(j.fare), 0);
  const avgRating =
    reviews.length === 0
      ? 5
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  const goBack = () => {
    if (onBack) onBack();
    else window.location.href = '/';
  };

  if (!session) {
    return (
      <PartnerAuthView
        role="driver"
        onBack={goBack}
        onSuccess={(sess) => {
          setSession(sess);
          if (!reg.name) {
            setReg({ ...reg, name: sess.name, phone: sess.phone });
          }
        }}
      />
    );
  }

  const inner = (
      <div className="min-h-screen flex flex-col bg-[#F5F7F7]">
        {/* Header gelap khas aplikasi Driver */}
        <header className="sticky top-0 z-30 bg-[#172124] text-white px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label="Kembali ke Pelanggan"
              className="min-h-[38px] px-2.5 rounded-xl bg-white/10 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Pelanggan
            </button>
            <div>
              <h1 className="text-sm font-bold leading-tight">GoDrive Driver</h1>
              <p className="text-[11px] text-white/70 leading-none">
                {reg.name || 'Mitra Pengemudi'} · ★{avgRating.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                online ? 'bg-[#0F9D8A] text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button
              type="button"
              onClick={() => {
                setOnline(false);
                setSession(null);
              }}
              title="Keluar akun driver"
              className="min-h-[34px] px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </header>

        {tab === 'map' ? (
          <div className="relative flex-1 min-h-[calc(100vh-7.5rem)]">
            <DriverMap driverPos={driverPos} job={activeJob} online={online} />
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto px-3 py-2 rounded-2xl bg-[#172124]/90 backdrop-blur-md text-white text-[11px] shadow-md flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    gps.coords ? 'bg-[#0F9D8A] animate-pulse' : gps.error ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono">
                  {gps.coords
                    ? `GPS Live ${driverPos.lat.toFixed(5)}, ${driverPos.lng.toFixed(5)}${
                        gps.accuracyMeters ? ` (±${gps.accuracyMeters}m)` : ''
                      }`
                    : gps.error
                      ? gps.error
                      : 'Menunggu sinyal GPS...'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLiveGpsEnabled(true);
                  gps.requestOnce();
                  locateMe();
                }}
                aria-label="Pusatkan ke GPS saya"
                className="pointer-events-auto min-h-[40px] px-3 rounded-2xl bg-white shadow-md text-xs font-bold text-[#172124] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LocateFixed className="w-4 h-4 text-[#0F9D8A]" /> GPS Live
              </button>
            </div>
            <div className="absolute left-0 right-0 bottom-20 z-20 px-3 max-w-lg mx-auto">
              <CockpitSheet
                online={online}
                verified={reg.status === 'verified'}
                todayCount={todayJobs.length}
                todayNet={todayNet}
                balance={balance}
                activeJob={activeJob}
                driverPos={driverPos}
                settings={settings}
                onToggleOnline={toggleOnline}
                onSimulateOffer={() => {
                  unlock();
                  triggerOffer();
                }}
                onOpenRegister={() => setTab('profile')}
                onAdvanceJob={advanceJob}
                onOpenChat={() => setChatOpen(true)}
                onCallCustomer={() =>
                  showToast(`Menelepon ${activeJob?.customer.name ?? 'pelanggan'} (simulasi)...`)
                }
                onToggleSound={() => {
                  unlock();
                  setSettings({ ...settings, sound: !settings.sound });
                }}
              />
            </div>
          </div>
        ) : (
          <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 pb-24">
            {tab === 'earnings' && <EarningsPanel history={history} />}
            {tab === 'wallet' && (
              <DriverWalletPanel balance={balance} txs={txs} reg={reg} onWithdraw={handleWithdraw} />
            )}
            {tab === 'profile' && (
              <ProfileAndDocsPanel
                reg={reg}
                reviews={reviews}
                onSaveReg={setReg}
                onBackToCustomer={goBack}
                toast={showToast}
              />
            )}
          </main>
        )}

        {/* Navigasi bawah Driver */}
        <nav
          aria-label="Navigasi driver"
          className="fixed bottom-0 left-0 right-0 z-30 bg-[#172124] text-white border-t border-white/10 grid grid-cols-4 h-16 pb-safe"
        >
          {(
            [
              ['map', 'Kokpit', Navigation],
              ['earnings', 'Pendapatan', BarChart3],
              ['wallet', 'Dompet', Wallet],
              ['profile', 'Profil & Dok', UserCheck],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  active ? 'text-[#0F9D8A] font-bold' : 'text-white/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-none">{label}</span>
              </button>
            );
          })}
        </nav>

        {offer && (
          <OfferModal
            job={offer}
            onAccept={() => {
              setActiveJob(offer);
              setOffer(null);
              showToast('Order diterima! Tekan Navigasi untuk petunjuk jalan.');
            }}
            onReject={() => setOffer(null)}
          />
        )}

        {chatOpen && activeJob && (
          <ChatModal
            job={activeJob}
            onClose={() => setChatOpen(false)}
            onSend={sendChat}
            onCall={() => showToast(`Menelepon ${activeJob.customer.name} (simulasi)...`)}
          />
        )}

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 top-16 z-50 max-w-[90vw] px-4 py-2.5 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> {toast}
          </div>
        )}
      </div>
  );
  return parentMaps ? inner : <PartnerMapsProvider>{inner}</PartnerMapsProvider>;
}
