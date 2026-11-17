import { useState } from 'react';
import { Check, ChevronRight, Clock, ReceiptText } from 'lucide-react';
import {
  SERVICES,
  formatRupiah,
  type OrderRecord,
} from '../data/jalanKitaData';
import { ServiceIcon } from './ServiceIcon';

interface ActivityViewProps {
  orders: OrderRecord[];
  onOpenOrder: (orderId: number) => void;
  onGoHome: () => void;
}

type ActivityFilter = 'all' | 'active' | 'done';

export function ActivityView({
  orders,
  onOpenOrder,
  onGoHome,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = orders.filter((o) => {
    const isDone = o.step >= o.steps.length;
    if (filter === 'active') return !isDone;
    if (filter === 'done') return isDone;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172124]">
            Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-[#5B676D] mt-0.5">
            Riwayat perjalanan, pesanan, dan donasimu.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-[#E9EEEE] rounded-xl">
            {(
              [
                ['all', 'Semua'],
                ['active', 'Berjalan'],
                ['done', 'Selesai'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  filter === key
                    ? 'bg-white text-[#172124] shadow-xs'
                    : 'text-[#5B676D] hover:text-[#172124]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E4E8EA] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F2F5F5] text-[#6B7780] flex items-center justify-center">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-base font-semibold text-[#172124]">
              {orders.length === 0
                ? 'Belum ada aktivitas'
                : 'Tidak ada pesanan pada filter ini'}
            </div>
            <p className="text-sm text-[#5B676D]">
              {orders.length === 0
                ? 'Coba pesan ojek, makanan, atau kirim barang dari Beranda.'
                : 'Pilih tab filter lain untuk melihat seluruh riwayat pesananmu.'}
            </p>
          </div>
          {orders.length === 0 && (
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Jelajahi Beranda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((order) => {
            const meta = SERVICES.find((s) => s.id === order.svc)!;
            const finished = order.step >= order.steps.length;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onOpenOrder(order.id)}
                className="bg-white hover:bg-[#FAFDFC] active:scale-[0.99] rounded-2xl p-4 border border-[#E4E8EA] hover:border-[#0F9D8A]/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl ${meta.tintBg} ${meta.tintText} flex items-center justify-center shrink-0`}
                  >
                    <ServiceIcon id={order.svc} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#172124] truncate">
                      {order.label}
                    </div>
                    <div className="text-xs text-[#5B676D] font-num mt-0.5 flex items-center gap-1.5">
                      <span>{order.time}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRupiah(order.amt)}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          finished ? 'text-[#0B7A6B]' : 'text-[#C4510A]'
                        }`}
                      >
                        {finished ? (
                          <>
                            <Check className="w-3 h-3" /> Selesai
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Berjalan
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8A969C] shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
