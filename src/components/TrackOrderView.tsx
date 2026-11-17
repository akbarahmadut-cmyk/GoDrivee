import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  Navigation,
  Send,
  Star,
  UserCheck,
} from 'lucide-react';
import {
  SERVICE_RADIUS_KM,
  SERVICES,
  buildGoogleMapsDirectionsUrl,
  formatRupiah,
  type OrderRecord,
} from '../data/jalanKitaData';
import {
  GoogleRouteMap,
  type LiveDriverTelemetry,
} from './GoogleRouteMap';
import { ServiceIcon } from './ServiceIcon';

interface TrackOrderViewProps {
  order: OrderRecord;
  onRateDriver: (orderId: number, stars: number) => void;
  onSendMessage: (orderId: number, text: string) => void;
  onBackHome: () => void;
}

const PICKUP_QUICK_REPLIES = [
  'Saya sudah di depan gerbang',
  'Titik jemput sesuai peta',
  'Posisi driver di mana?',
  'Saya tunggu di pinggir jalan',
];

export function TrackOrderView({
  order,
  onRateDriver,
  onSendMessage,
  onBackHome,
}: TrackOrderViewProps) {
  const meta = SERVICES.find((s) => s.id === order.svc)!;
  const finished = order.step >= order.steps.length;
  const isRide = order.svc === 'bike' || order.svc === 'car';
  const supportsDriver =
    order.svc === 'bike' ||
    order.svc === 'car' ||
    order.svc === 'pickup' ||
    order.svc === 'food' ||
    order.svc === 'shop';
  const showDriverCard = order.step >= 1 && supportsDriver;

  const [telemetry, setTelemetry] = useState<LiveDriverTelemetry | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const messages = order.messages ?? [];

  const handleTelemetry = useCallback((next: LiveDriverTelemetry) => {
    setTelemetry(next);
  }, []);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, showDriverCard]);

  const handleSubmitChat = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draftMessage.trim();
    if (!trimmed || finished) return;
    onSendMessage(order.id, trimmed);
    setDraftMessage('');
  };

  const hasMapRoute = Boolean(order.origin && order.destination);
  const mapsUrl =
    order.origin && order.destination
      ? buildGoogleMapsDirectionsUrl(
          order.origin,
          order.destination,
          order.svc === 'car' ? 'driving' : 'two-wheeler'
        )
      : null;

  return (
    <div className="space-y-5">
      {/* Live Google Maps Driver Tracking Map */}
      {hasMapRoute && order.origin && order.destination && (
        <div className="space-y-3">
          <GoogleRouteMap
            origin={order.origin}
            destination={order.destination}
            travelMode={order.svc === 'car' ? 'DRIVING' : 'TWO_WHEELER'}
            heightClass="h-64 sm:h-80"
            tracking={{
              step: order.step,
              totalSteps: order.steps.length,
              driverName: order.drv[0],
              driverPlate: order.drv[1],
              service: order.svc,
              onTelemetry: handleTelemetry,
            }}
          />

          {/* Live Driver Telemetry Strip */}
          {telemetry && (
            <div className="bg-white rounded-2xl p-4 border border-[#E4E8EA] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#172124]">
                    {telemetry.phaseLabel}
                  </div>
                  <div className="text-xs text-[#5B676D] font-mono-num truncate">
                    Posisi GPS: {telemetry.position.lat.toFixed(5)},{' '}
                    {telemetry.position.lng.toFixed(5)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <div className="text-[11px] text-[#6B7780]">Sisa jarak</div>
                  <div className="text-sm font-bold font-num text-[#172124]">
                    {telemetry.remainingKm === 0
                      ? '0 m'
                      : telemetry.remainingKm < 1
                        ? `${Math.round(telemetry.remainingKm * 1000)} m`
                        : `${telemetry.remainingKm.toFixed(1)} km`}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#6B7780]">Estimasi</div>
                  <div className="text-sm font-bold font-num text-[#0B7A6B]">
                    {telemetry.etaMinutes === 0
                      ? 'Tiba'
                      : `± ${telemetry.etaMinutes} mnt`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl ${meta.tintBg} ${meta.tintText} flex items-center justify-center shrink-0`}
                >
                  <ServiceIcon id={order.svc} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-[#172124]">
                    {order.label}
                  </div>
                  <div className="text-xs text-[#5B676D] font-num mt-0.5">
                    {formatRupiah(order.amt)} · {order.time}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                  finished ? 'text-[#0B7A6B]' : 'text-[#C4510A]'
                }`}
              >
                {finished ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Selesai
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" /> Berjalan
                  </>
                )}
              </span>
            </div>

            {order.extra?.note && (
              <div className="pt-2 text-xs text-[#5B676D] border-t border-[#F0F3F4]">
                Catatan:{' '}
                <span className="text-[#172124]">{order.extra.note}</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA]">
            <h2 className="text-sm font-bold text-[#172124] mb-4">
              Progres Pesanan
            </h2>
            <ol className="space-y-4">
              {order.steps.map((label, idx) => {
                const isDone = idx < order.step || finished;
                const isCurrent = idx === order.step && !finished;
                return (
                  <li key={label} className="flex items-center gap-3.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isDone
                          ? 'bg-[#0F9D8A] text-white'
                          : isCurrent
                            ? 'bg-[#FF7A1A] text-white'
                            : 'bg-[#ECEFEF] text-[#8A969C]'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div
                      className={`text-sm ${
                        isDone || isCurrent
                          ? 'font-semibold text-[#172124]'
                          : 'text-[#8A969C]'
                      }`}
                    >
                      {label}
                    </div>
                  </li>
                );
              })}
            </ol>

            {order.step === 0 && !finished && order.extra?.nearbyCount ? (
              <p className="mt-4 pt-3 border-t border-[#F0F3F4] text-xs text-[#5B676D]">
                {order.extra.nearbyCount} driver aktif ditemukan dalam radius{' '}
                {SERVICE_RADIUS_KM} km dari titik jemput.
              </p>
            ) : null}
          </div>
        </div>

        {/* Right Column: Driver Info, Driver Chat, External Maps Link & Rating */}
        <div className="lg:col-span-5 space-y-4">
          {supportsDriver && order.step === 0 && !finished && (
            <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F2F5F5] text-[#5B676D] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#172124]">
                  Menghubungkan Driver
                </div>
                <p className="text-xs text-[#5B676D] mt-0.5">
                  Chat koordinasi penjemputan akan aktif setelah driver menerima pesanan.
                </p>
              </div>
            </div>
          )}

          {showDriverCard && (
            <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#172124]">
                      {order.drv[0]}
                    </div>
                    <div className="text-xs text-[#5B676D] font-num mt-0.5">
                      {order.drv[1]} · Rating 4.9
                    </div>
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${meta.tintBg} ${meta.tintText} flex items-center justify-center shrink-0`}
                >
                  <ServiceIcon id={order.svc} className="w-5 h-5" />
                </div>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#F2F5F5] hover:bg-[#E6ECEB] text-[#172124] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  Buka Rute di Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {showDriverCard && (
            <section
              aria-labelledby="driver-chat-heading"
              className="bg-white rounded-2xl border border-[#E4E8EA] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-3.5 border-b border-[#F0F3F4] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-[#0B7A6B] shrink-0" />
                  <div className="min-w-0">
                    <h2
                      id="driver-chat-heading"
                      className="text-sm font-bold text-[#172124] truncate"
                    >
                      Chat Koordinasi Jemput
                    </h2>
                    <p className="text-xs text-[#5B676D] truncate">
                      {order.drv[0]} · {order.drv[1]}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-num text-[#6B7780] whitespace-nowrap shrink-0">
                  {messages.length} pesan
                </span>
              </div>

              {/* Message Thread */}
              <div
                ref={chatScrollRef}
                className="p-4 space-y-2.5 max-h-64 overflow-y-auto bg-[#FAFDFC]"
              >
                {messages.length === 0 ? (
                  <p className="text-xs text-[#5B676D] text-center py-4">
                    Kirim pesan untuk memberi patokan lokasi jemput kepada driver.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isUser ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? 'bg-[#0F9D8A] text-white rounded-br-sm'
                              : 'bg-white text-[#172124] border border-[#E4E8EA] rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[11px] font-num text-[#6B7780] mt-1 px-1">
                          {isUser ? 'Anda' : order.drv[0].split(' ')[0]} ·{' '}
                          {msg.time}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Replies + Composer */}
              {!finished ? (
                <div className="p-3.5 border-t border-[#F0F3F4] bg-white space-y-2.5">
                  <div
                    aria-label="Pesan cepat koordinasi"
                    className="flex items-center gap-2 overflow-x-auto pb-1"
                  >
                    {PICKUP_QUICK_REPLIES.map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => onSendMessage(order.id, quick)}
                        className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F2F5F5] hover:bg-[#E3F5F2] hover:text-[#0B7A6B] text-[#172124] text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitChat} className="flex gap-2">
                    <input
                      type="text"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      placeholder="Tulis patokan atau pesan ke driver..."
                      aria-label="Pesan untuk driver"
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2E4] bg-white text-base sm:text-sm text-[#172124] placeholder:text-[#8A969C] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                    />
                    <button
                      type="submit"
                      disabled={!draftMessage.trim()}
                      aria-label="Kirim pesan"
                      className="min-w-[44px] min-h-[44px] px-3.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="px-4 py-3 border-t border-[#F0F3F4] bg-white text-xs text-[#6B7780] text-center">
                  Pesanan selesai · percakapan koordinasi ditutup
                </div>
              )}
            </section>
          )}

          {finished && isRide && (
            <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] text-center space-y-3">
              <div className="text-sm font-bold text-[#172124]">
                Beri rating driver
              </div>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (order.rate ?? 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Beri ${star} bintang`}
                      onClick={() => onRateDriver(order.id, star)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? 'fill-[#FFB400] text-[#FFB400]'
                            : 'text-[#CBD2D6]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {order.rate ? (
                <p className="text-xs text-[#0B7A6B] font-medium">
                  Terima kasih atas penilaian {order.rate}/5 bintang!
                </p>
              ) : null}
            </div>
          )}

          {finished && (
            <button
              type="button"
              onClick={onBackHome}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
