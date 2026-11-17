import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { SHOP_ITEMS, formatRupiah } from '../data/jalanKitaData';
import { ShopItemIcon } from './ServiceIcon';

interface ShopViewProps {
  quantities: Record<number, number>;
  onChangeQty: (itemIndex: number, delta: number) => void;
  onGoToCheckout: () => void;
}

export function ShopView({
  quantities,
  onChangeQty,
  onGoToCheckout,
}: ShopViewProps) {
  const totalCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const subtotal = SHOP_ITEMS.reduce(
    (sum, item, idx) => sum + item.price * (quantities[idx] ?? 0),
    0
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <p className="text-sm text-[#5B676D]">
        Perlengkapan harian, elektronik ringan, dan sandang siap antar ke alamatmu.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {SHOP_ITEMS.map((item, idx) => {
          const qty = quantities[idx] ?? 0;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-[#E4E8EA] flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5E8F4] text-[#862E83] flex items-center justify-center">
                  <ShopItemIcon id={item.id} className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs text-[#6B7780]">{item.category}</div>
                  <div className="text-sm font-bold text-[#172124] mt-0.5 leading-snug">
                    {item.name}
                  </div>
                  <div className="text-sm font-semibold text-[#0B7A6B] font-num mt-1">
                    {formatRupiah(item.price)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-[#F0F3F4]">
                <button
                  type="button"
                  aria-label={`Kurangi ${item.name}`}
                  disabled={qty === 0}
                  onClick={() => onChangeQty(idx, -1)}
                  className="w-10 h-10 rounded-full border border-[#DCE2E4] bg-white hover:bg-[#F5F7F7] disabled:opacity-35 text-[#0B7A6B] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold font-num text-[#172124]">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label={`Tambah ${item.name}`}
                  onClick={() => onChangeQty(idx, 1)}
                  className="w-10 h-10 rounded-full border border-[#0F9D8A] bg-[#E3F5F2] hover:bg-[#D1EFEA] text-[#0B7A6B] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalCount > 0 && (
        <div className="fixed lg:sticky bottom-[68px] lg:bottom-4 left-0 right-0 z-30 px-4 lg:px-0">
          <div className="max-w-5xl mx-auto">
            <button
              type="button"
              onClick={onGoToCheckout}
              className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white font-semibold text-sm sm:text-base flex items-center justify-between gap-3 shadow-lg shadow-[#0B7A6B]/20 cursor-pointer transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Keranjang · {totalCount} barang
              </span>
              <span className="font-num font-bold">{formatRupiah(subtotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
