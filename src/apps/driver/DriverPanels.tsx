import { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileCheck,
  MessageCircle,
  Navigation,
  Phone,
  Power,
  Send,
  Star,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react';
import { formatRupiah, type LatLngPoint } from '../../data/jalanKitaData';
import { Field } from '../PartnerShell';
import {
  COMMISSION_RATE,
  MIN_WITHDRAW,
  OFFER_TIMEOUT_S,
  QUICK_REPLIES,
  commissionOf,
  formatTime,
  navigationUrl,
  startOfDay,
  type DriverJob,
  type DriverSettings,
  type Registration,
  type Review,
  type VehicleType,
  type WalletTx,
} from './driverData';

/** Modal tawaran order masuk dengan hitung mundur. */
export function OfferModal({
  job,
  onAccept,
  onReject,
}: {
  job: DriverJob;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [sec, setSec] = useState(OFFER_TIMEOUT_S);
  useEffect(() => {
    const id = window.setInterval(() => {
      setSec((s) => {
        if (s <= 1) {
          onReject();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [job.id, onReject]);

  const net = job.fare - commissionOf(job.fare);
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-3xl bg-[#172124] text-white p-5 space-y-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-[#0F9D8A] text-xs font-bold">
            {job.service} · {job.payment}
          </span>
          <span className="text-sm font-num font-bold text-[#FFB020]">{sec} dtk</span>
        </div>
        <div>
          <p className="text-2xl font-bold font-num">{formatRupiah(job.fare)}</p>
          <p className="text-xs text-white/70">
            Bersih {formatRupiah(net)} · {job.distanceKm.toFixed(1)} km · {job.customer.name} (★{job.customer.rating})
          </p>
        </div>
        <div className="space-y-2 text-sm bg-white/5 rounded-2xl p-3">
          <div>
            <span className="text-[11px] text-[#0F9D8A] font-bold">JEMPUT</span>
            <p className="font-semibold">{job.pickup.label}</p>
          </div>
          <div>
            <span className="text-[11px] text-[#FF7A1A] font-bold">TUJUAN</span>
            <p className="font-semibold">{job.dropoff.label}</p>
          </div>
          {job.note && <p className="text-xs text-white/70">Catatan: {job.note}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onReject}
            className="min-h-[56px] rounded-2xl bg-white/10 text-sm font-bold cursor-pointer"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="col-span-2 min-h-[56px] rounded-2xl bg-[#0F9D8A] text-base font-bold cursor-pointer"
          >
            TERIMA ORDER
          </button>
        </div>
      </div>
    </div>
  );
}

/** Panel bawah saat tidak ada order maupun saat sedang menjalankan order. */
export function CockpitSheet({
  online,
  verified,
  todayCount,
  todayNet,
  balance,
  activeJob,
  driverPos,
  settings,
  onToggleOnline,
  onSimulateOffer,
  onOpenRegister,
  onAdvanceJob,
  onOpenChat,
  onCallCustomer,
  onToggleSound,
}: {
  online: boolean;
  verified: boolean;
  todayCount: number;
  todayNet: number;
  balance: number;
  activeJob: DriverJob | null;
  driverPos: LatLngPoint;
  settings: DriverSettings;
  onToggleOnline: () => void;
  onSimulateOffer: () => void;
  onOpenRegister: () => void;
  onAdvanceJob: () => void;
  onOpenChat: () => void;
  onCallCustomer: () => void;
  onToggleSound: () => void;
}) {
  if (activeJob) {
    const toPickup = activeJob.phase === 'to_pickup';
    const target = toPickup ? activeJob.pickup : activeJob.dropoff;
    const navHref = navigationUrl(target.query, driverPos);
    return (
      <div className="rounded-3xl bg-[#172124] text-white p-4 space-y-3 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#0F9D8A]">
              {toPickup ? '1. Menuju titik jemput' : '2. Mengantar ke tujuan'}
            </span>
            <h3 className="text-base font-bold">{target.label}</h3>
            <p className="text-xs text-white/70">
              {activeJob.service} · {activeJob.customer.name} · {formatRupiah(activeJob.fare)} ({activeJob.payment})
            </p>
          </div>
          <a
            href={navHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] px-4 rounded-2xl bg-[#0F9D8A] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <Navigation className="w-4 h-4" /> Navigasi
          </a>
        </div>
        {activeJob.note && (
          <p className="text-xs bg-white/10 rounded-xl px-3 py-2">Catatan: {activeJob.note}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenChat}
            className="min-h-[48px] rounded-2xl bg-white/10 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Chat ({activeJob.chat.length})
          </button>
          <button
            type="button"
            onClick={onCallCustomer}
            className="min-h-[48px] rounded-2xl bg-white/10 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Phone className="w-4 h-4" /> Telepon
          </button>
        </div>
        <button
          type="button"
          onClick={onAdvanceJob}
          className="w-full min-h-[56px] rounded-2xl bg-[#FF7A1A] text-white text-base font-bold cursor-pointer"
        >
          {toPickup ? 'SUDAH JEMPUT / AMBIL' : 'SELESAIKAN ORDER'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[#172124] text-white p-4 space-y-3 shadow-2xl border border-white/10">
      {!verified && (
        <button
          type="button"
          onClick={onOpenRegister}
          className="w-full rounded-2xl bg-[#FFB020] text-[#172124] px-3 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer"
        >
          <span>Lengkapi pendaftaran & dokumen (KTP, SIM, STNK) untuk mulai narik</span>
          <span>→</span>
        </button>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/5 p-2.5">
          <p className="text-base font-bold font-num">{todayCount}</p>
          <p className="text-[11px] text-white/70">Order hari ini</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-2.5">
          <p className="text-base font-bold font-num">{formatRupiah(todayNet)}</p>
          <p className="text-[11px] text-white/70">Bersih hari ini</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-2.5">
          <p className="text-base font-bold font-num">{formatRupiah(balance)}</p>
          <p className="text-[11px] text-white/70">Saldo dompet</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleOnline}
          className={`flex-1 min-h-[56px] rounded-2xl text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
            online ? 'bg-red-600 text-white' : 'bg-[#0F9D8A] text-white'
          }`}
        >
          <Power className="w-5 h-5" />
          {online ? 'MATIKAN (OFFLINE)' : 'MULAI NARIK (ONLINE)'}
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={settings.sound ? 'Matikan suara order' : 'Nyalakan suara order'}
          className="min-h-[56px] px-4 rounded-2xl bg-white/10 inline-flex items-center justify-center cursor-pointer"
        >
          {settings.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
      {online && (
        <button
          type="button"
          onClick={onSimulateOffer}
          className="w-full min-h-[44px] rounded-xl bg-white/10 text-xs font-semibold cursor-pointer"
        >
          + Tes order masuk sekarang (dengan bunyi)
        </button>
      )}
    </div>
  );
}

/** Modal chat & telepon pelanggan. */
export function ChatModal({
  job,
  onClose,
  onSend,
  onCall,
}: {
  job: DriverJob;
  onClose: () => void;
  onSend: (text: string) => void;
  onCall: () => void;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-3xl bg-white text-[#172124] p-4 space-y-3 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E4E8EA] pb-2">
          <div>
            <h3 className="text-sm font-bold">{job.customer.name}</h3>
            <p className="text-xs text-[#5B676D]">{job.service}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCall}
              aria-label="Telepon pelanggan"
              className="min-h-[40px] px-3 rounded-xl bg-[#E6F6F3] text-[#0B7A6B] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Telepon
            </button>
            <button type="button" onClick={onClose} aria-label="Tutup chat" className="p-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-[160px]">
          {job.chat.length === 0 && (
            <p className="text-xs text-[#5B676D] text-center">Belum ada pesan. Gunakan balasan cepat di bawah.</p>
          )}
          {job.chat.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'driver' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs ${
                  m.from === 'driver' ? 'bg-[#0F9D8A] text-white' : 'bg-[#F5F7F7] text-[#172124]'
                }`}
              >
                <p>{m.text}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{formatTime(m.time)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSend(q)}
              className="shrink-0 px-2.5 py-1.5 rounded-full bg-[#F5F7F7] text-xs font-medium cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ketik pesan..."
            className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#DCE2E4] text-base sm:text-sm"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Kirim pesan"
            className="min-h-[44px] px-4 rounded-xl bg-[#0F9D8A] text-white cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tab Pendapatan: laporan harian & mingguan + riwayat order. */
export function EarningsPanel({ history }: { history: DriverJob[] }) {
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const cutoff = period === 'today' ? startOfDay(Date.now()) : startOfDay(Date.now() - 6 * 86400000);
  const filtered = history.filter((j) => (j.completedAt ?? j.createdAt) >= cutoff);
  const gross = filtered.reduce((s, j) => s + j.fare, 0);
  const comm = filtered.reduce((s, j) => s + commissionOf(j.fare), 0);
  const net = gross - comm;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-white border border-[#E4E8EA] rounded-2xl p-1.5">
        {(['today', 'week'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setPeriod(k)}
            className={`min-h-[44px] rounded-xl text-xs font-bold cursor-pointer ${
              period === k ? 'bg-[#172124] text-white' : 'text-[#5B676D]'
            }`}
          >
            {k === 'today' ? 'Hari Ini' : '7 Hari Terakhir'}
          </button>
        ))}
      </div>

      <section className="bg-[#172124] text-white rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">Pendapatan bersih</span>
          <BarChart3 className="w-4 h-4 text-[#0F9D8A]" />
        </div>
        <p className="text-2xl font-bold font-num">{formatRupiah(net)}</p>
        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/10">
          <div>
            <p className="text-white/60">Order</p>
            <p className="font-bold font-num">{filtered.length}</p>
          </div>
          <div>
            <p className="text-white/60">Kotor</p>
            <p className="font-bold font-num">{formatRupiah(gross)}</p>
          </div>
          <div>
            <p className="text-white/60">Komisi ({COMMISSION_RATE * 100}%)</p>
            <p className="font-bold font-num text-[#FFB020]">-{formatRupiah(comm)}</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold">Riwayat perjalanan</h3>
        {filtered.length === 0 ? (
          <p className="text-xs text-[#5B676D]">Belum ada perjalanan selesai pada periode ini.</p>
        ) : (
          filtered.map((j) => {
            const c = commissionOf(j.fare);
            return (
              <div key={j.id} className="border-b border-[#F0F3F4] pb-2.5 last:border-0 text-xs space-y-0.5">
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>{j.service} · {j.payment}</span>
                  <span className="font-num text-[#0B7A6B]">+{formatRupiah(j.fare - c)}</span>
                </div>
                <p className="text-[#5B676D]">{j.pickup.label} → {j.dropoff.label}</p>
                <p className="text-[#9AA5AA] font-num">
                  Tarif {formatRupiah(j.fare)} · Komisi -{formatRupiah(c)} · {formatTime(j.completedAt ?? j.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/** Tab Dompet Driver: saldo, penarikan dana, potongan komisi. */
export function DriverWalletPanel({
  balance,
  txs,
  reg,
  onWithdraw,
}: {
  balance: number;
  txs: WalletTx[];
  reg: Registration;
  onWithdraw: (amount: number, bank: string, acc: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState(reg.bankName || 'BRI');
  const [acc, setAcc] = useState(reg.bankAccount || '');

  const submit = () => {
    const n = parseInt(amount.replace(/\D/g, ''), 10);
    if (!Number.isNaN(n)) {
      onWithdraw(n, bank, acc);
      setAmount('');
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-[#172124] text-white rounded-2xl p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Saldo Dompet Driver</span>
          <Wallet className="w-4 h-4 text-[#0F9D8A]" />
        </div>
        <p className="text-2xl font-bold font-num">{formatRupiah(balance)}</p>
        <p className="text-[11px] text-white/70">
          Order JK Pay menambah saldo bersih. Order Tunai memotong komisi {COMMISSION_RATE * 100}% dari saldo.
        </p>
      </section>

      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold">Tarik dana ke rekening</h3>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bank / E-Wallet" value={bank} onChange={setBank} placeholder="BRI / Dana" />
          <Field label="No. Rekening" value={acc} onChange={setAcc} placeholder="1234567890" />
        </div>
        <Field label={`Nominal (min. ${formatRupiah(MIN_WITHDRAW)})`} value={amount} onChange={setAmount} type="number" />
        <button
          type="button"
          onClick={submit}
          className="w-full min-h-[48px] rounded-xl bg-[#0F9D8A] text-white text-sm font-bold cursor-pointer"
        >
          Tarik Dana Sekarang
        </button>
      </section>

      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-2.5">
        <h3 className="text-sm font-bold">Mutasi & potongan komisi</h3>
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-xs border-b border-[#F0F3F4] pb-2 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              {t.amount >= 0 ? (
                <ArrowDownLeft className="w-4 h-4 text-[#0B7A6B] shrink-0" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.label}</p>
                <p className="text-[#9AA5AA]">{formatTime(t.time)}</p>
              </div>
            </div>
            <span className={`font-num font-bold shrink-0 ${t.amount >= 0 ? 'text-[#0B7A6B]' : 'text-red-600'}`}>
              {t.amount >= 0 ? '+' : ''}
              {formatRupiah(t.amount)}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

/** Tab Profil: rating & ulasan pelanggan + pendaftaran & verifikasi dokumen (KTP, SIM, STNK). */
export function ProfileAndDocsPanel({
  reg,
  reviews,
  onSaveReg,
  onBackToCustomer,
  toast,
}: {
  reg: Registration;
  reviews: Review[];
  onSaveReg: (next: Registration) => void;
  onBackToCustomer: () => void;
  toast: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<Registration>(reg);
  useEffect(() => setDraft(reg), [reg]);

  const avg =
    reviews.length === 0
      ? 5
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  const pickDoc = (key: 'ktp' | 'sim' | 'stnk', file?: File) => {
    if (!file) return;
    setDraft((d) => ({ ...d, docs: { ...d.docs, [key]: file.name } }));
  };

  const submitVerify = () => {
    if (!draft.name.trim() || !draft.plate.trim()) {
      toast('Isi nama dan plat nomor terlebih dahulu.');
      return;
    }
    if (!draft.docs.ktp || !draft.docs.sim || !draft.docs.stnk) {
      toast('Unggah foto KTP, SIM, dan STNK terlebih dahulu.');
      return;
    }
    onSaveReg({ ...draft, status: 'pending' });
    toast('Dokumen dikirim. Menunggu verifikasi...');
  };

  return (
    <div className="space-y-4">
      {/* Rating & Ulasan */}
      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Rating & ulasan pelanggan</h3>
            <p className="text-xs text-[#5B676D]">{reviews.length} ulasan diterima</p>
          </div>
          <div className="flex items-center gap-1 bg-[#FFF6E5] text-[#B86E00] px-3 py-1.5 rounded-xl font-bold font-num">
            <Star className="w-4 h-4 fill-[#FFB020] text-[#FFB020]" /> {avg.toFixed(1)}
          </div>
        </div>
        {reviews.slice(0, 5).map((r) => (
          <div key={r.id} className="border-t border-[#F0F3F4] pt-2 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span>{r.customer}</span>
              <span className="text-[#B86E00]">{'★'.repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="text-[#5B676D] mt-0.5">"{r.comment}"</p>}
          </div>
        ))}
      </section>

      {/* Pendaftaran & Verifikasi Dokumen */}
      <section className="bg-white border border-[#E4E8EA] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Pendaftaran & dokumen mitra</h3>
          <StatusBadge status={reg.status} />
        </div>
        <Field label="Nama lengkap (sesuai KTP)" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
        <Field label="No. HP / WhatsApp" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} type="tel" />
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-medium text-[#5B676D] mb-1">Kendaraan</span>
            <select
              value={draft.vehicleType}
              onChange={(e) => setDraft({ ...draft, vehicleType: e.target.value as VehicleType })}
              className="w-full min-h-[48px] px-3 rounded-xl border border-[#DCE2E4] bg-white text-sm"
            >
              <option value="Motor">Motor</option>
              <option value="Mobil">Mobil</option>
            </select>
          </label>
          <Field label="Plat nomor" value={draft.plate} onChange={(v) => setDraft({ ...draft, plate: v })} placeholder="DD 1234 XX" />
        </div>
        <Field label="Merk / tipe kendaraan" value={draft.vehicleModel} onChange={(v) => setDraft({ ...draft, vehicleModel: v })} placeholder="Honda Beat" />

        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-[#5B676D]">Unggah dokumen wajib</p>
          {(
            [
              ['ktp', 'Foto KTP'],
              ['sim', 'Foto SIM A / C aktif'],
              ['stnk', 'Foto STNK kendaraan'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="min-h-[48px] px-3 py-2 rounded-xl border border-dashed border-[#DCE2E4] flex items-center justify-between text-xs cursor-pointer hover:bg-[#F5F7F7]"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <FileCheck className="w-4 h-4 text-[#0F9D8A]" />
                {label}
              </span>
              <span className="text-[#0B7A6B] truncate max-w-[160px]">
                {draft.docs[key] ?? 'Pilih foto...'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickDoc(key, e.target.files?.[0])}
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={submitVerify}
          className="w-full min-h-[48px] rounded-xl bg-[#0F9D8A] text-white text-sm font-bold cursor-pointer"
        >
          {reg.status === 'verified' ? 'Perbarui Data & Dokumen' : 'Kirim untuk Verifikasi'}
        </button>
        {reg.status === 'pending' && (
          <button
            type="button"
            onClick={() => {
              onSaveReg({ ...draft, status: 'verified' });
              toast('Simulasi: akun driver terverifikasi!');
            }}
            className="w-full min-h-[44px] rounded-xl bg-[#172124] text-white text-xs font-bold cursor-pointer"
          >
            Simulasi: Setujui Verifikasi Sekarang
          </button>
        )}
      </section>

      <button
        type="button"
        onClick={onBackToCustomer}
        className="w-full min-h-[48px] rounded-2xl border border-[#E4E8EA] bg-white text-sm font-bold text-[#172124] cursor-pointer"
      >
        ← Kembali ke Aplikasi Pelanggan
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: Registration['status'] }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6F6F3] text-[#0B7A6B] text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF6E5] text-[#B86E00] text-xs font-bold">
        <Clock className="w-3.5 h-3.5" /> Menunggu
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full bg-[#F5F7F7] text-[#5B676D] text-xs font-bold">
      Belum daftar
    </span>
  );
}
