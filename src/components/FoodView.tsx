import { ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import {
  RESTAURANTS,
  formatRupiah,
  type Restaurant,
} from '../data/jalanKitaData';
import { RestaurantIcon } from './ServiceIcon';

interface FoodListViewProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export function FoodListView({ onSelectRestaurant }: FoodListViewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5B676D]">
        Pilih warung dan rumah makan mitra di sekitar Kahu untuk pesan antar cepat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {RESTAURANTS.map((resto) => (
          <button
            key={resto.id}
            type="button"
            onClick={() => onSelectRestaurant(resto.id)}
            className="bg-white hover:bg-[#FAFDFC] active:scale-[0.99] rounded-2xl p-4 border border-[#E4E8EA] hover:border-[#0F9D8A]/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer min-h-[76px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E5] text-[#C4510A] flex items-center justify-center shrink-0">
                <RestaurantIcon id={resto.id} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-[#172124] truncate">
                  {resto.name}
                </div>
                <div className="text-xs text-[#5B676D] mt-0.5">
                  {resto.category} · {resto.eta} · {resto.items.length} menu
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8A969C] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface RestaurantMenuViewProps {
  restaurant: Restaurant;
  quantities: Record<number, number>;
  onChangeQty: (itemIndex: number, delta: number) => void;
  onGoToCheckout: () => void;
}

export function RestaurantMenuView({
  restaurant,
  quantities,
  onChangeQty,
  onGoToCheckout,
}: RestaurantMenuViewProps) {
  const totalCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const subtotal = restaurant.items.reduce(
    (sum, item, idx) => sum + item.price * (quantities[idx] ?? 0),
    0
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4E8EA] flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0E5] text-[#C4510A] flex items-center justify-center shrink-0">
          <RestaurantIcon id={restaurant.id} className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#172124]">{restaurant.name}</h2>
          <p className="text-xs sm:text-sm text-[#5B676D]">
            {restaurant.category} · Estimasi antar {restaurant.eta}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {restaurant.items.map((item, idx) => {
          const qty = quantities[idx] ?? 0;
          return (
            <div
              key={item.name}
              className="bg-white rounded-2xl p-4 border border-[#E4E8EA] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-[#172124] truncate">
                  {item.name}
                </div>
                <div className="text-sm text-[#5B676D] font-num mt-0.5">
                  {formatRupiah(item.price)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
                Lihat keranjang · {totalCount} item
              </span>
              <span className="font-num font-bold">{formatRupiah(subtotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
