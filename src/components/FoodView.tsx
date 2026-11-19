import { useState } from 'react';
import { ChevronRight, ImageIcon, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import {
  RESTAURANTS,
  formatRupiah,
  type Restaurant,
  type RestaurantMenuItem,
} from '../data/jalanKitaData';
import { RestaurantIcon } from './ServiceIcon';

/** Gabungkan restoran bawaan dengan toko & produk(+5 gambar) dari Mitra Pedagang di localStorage. */
export function getAvailableRestaurants(): Restaurant[] {
  try {
    const storeRaw = window.localStorage.getItem('gd-umkm-store');
    const prodRaw = window.localStorage.getItem('gd-umkm-products');
    if (!storeRaw || !prodRaw) return RESTAURANTS;
    const store = JSON.parse(storeRaw) as {
      name?: string;
      category?: string;
      open?: boolean;
      images?: string[];
    };
    const prods = JSON.parse(prodRaw) as {
      id: string;
      name: string;
      price: number;
      available: boolean;
      images?: string[];
    }[];
    const availProds = (prods ?? []).filter((p) => p.available);
    if (availProds.length === 0) return RESTAURANTS;

    const umkmResto: Restaurant = {
      id: 'umkm-live',
      name: store.name || 'Warung Mitra Kahu',
      category: store.category || 'Mitra UMKM',
      eta: '12 mnt',
      searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
      image: store.images?.[0] || RESTAURANTS[0].image,
      items: availProds.map((p, idx) => ({
        name: p.name,
        price: p.price,
        description: 'Menu spesial dari Mitra Pedagang GoDrive',
        image:
          p.images?.[0] ||
          RESTAURANTS[idx % RESTAURANTS.length].items[0]?.image,
        images: p.images && p.images.length > 0 ? p.images : undefined,
      })),
    };
    return [umkmResto, ...RESTAURANTS];
  } catch {
    return RESTAURANTS;
  }
}

interface FoodListViewProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export function FoodListView({ onSelectRestaurant }: FoodListViewProps) {
  const restaurants = getAvailableRestaurants();

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5B676D]">
        Pilih warung dan rumah makan mitra di sekitar Kahu untuk pesan antar cepat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {restaurants.map((resto) => (
          <button
            key={resto.id}
            type="button"
            onClick={() => onSelectRestaurant(resto.id)}
            className="bg-white hover:bg-[#FAFDFC] active:scale-[0.99] rounded-2xl overflow-hidden border border-[#E4E8EA] hover:border-[#0F9D8A]/50 flex flex-col text-left transition-all cursor-pointer"
          >
            {resto.image ? (
              <div className="relative h-32 w-full bg-[#FFF0E5] overflow-hidden">
                <img
                  src={resto.image}
                  alt={resto.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[11px] font-semibold">
                  {resto.eta}
                </span>
              </div>
            ) : null}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E5] text-[#C4510A] flex items-center justify-center shrink-0">
                  <RestaurantIcon id={resto.id} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-[#172124] truncate">
                    {resto.name}
                  </div>
                  <div className="text-xs text-[#5B676D] mt-0.5">
                    {resto.category} · {resto.items.length} menu bergambar
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#8A969C] shrink-0" />
            </div>
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
  const [previewItem, setPreviewItem] = useState<RestaurantMenuItem | null>(
    null
  );
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const totalCount = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const subtotal = restaurant.items.reduce(
    (sum, item, idx) => sum + item.price * (quantities[idx] ?? 0),
    0
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E4E8EA]">
        {restaurant.image && (
          <div className="h-36 sm:h-44 w-full bg-[#FFF0E5] overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0E5] text-[#C4510A] flex items-center justify-center shrink-0">
            <RestaurantIcon id={restaurant.id} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172124]">
              {restaurant.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B676D]">
              {restaurant.category} · Estimasi antar {restaurant.eta}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {restaurant.items.map((item, idx) => {
          const qty = quantities[idx] ?? 0;
          const gallery =
            item.images && item.images.length > 0
              ? item.images
              : item.image
                ? [item.image]
                : [];
          const thumb = gallery[0];

          return (
            <div
              key={item.name}
              className="bg-white rounded-2xl p-3.5 border border-[#E4E8EA] flex items-center gap-3.5"
            >
              {/* Gambar Menu */}
              <button
                type="button"
                onClick={() => {
                  if (gallery.length > 0) {
                    setPreviewItem(item);
                    setActivePhotoIdx(0);
                  }
                }}
                className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#FFF0E5] border border-[#E4E8EA] shrink-0 cursor-pointer group"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4510A]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {gallery.length > 1 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                    +{gallery.length} foto
                  </span>
                )}
              </button>

              {/* Info & Tombol Jumlah */}
              <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[96px]">
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#172124] truncate">
                    {item.name}
                  </div>
                  {item.description && (
                    <p className="text-xs text-[#5B676D] line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="text-sm font-bold text-[#0B7A6B] font-num">
                    {formatRupiah(item.price)}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label={`Kurangi ${item.name}`}
                      disabled={qty === 0}
                      onClick={() => onChangeQty(idx, -1)}
                      className="w-9 h-9 rounded-full border border-[#DCE2E4] bg-white hover:bg-[#F5F7F7] disabled:opacity-35 text-[#0B7A6B] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold font-num text-[#172124]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tambah ${item.name}`}
                      onClick={() => onChangeQty(idx, 1)}
                      className="w-9 h-9 rounded-full border border-[#0F9D8A] bg-[#E3F5F2] hover:bg-[#D1EFEA] text-[#0B7A6B] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preview Gambar Menu (mendukung hingga 5 foto dari Mitra Pedagang) */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172124]">
                  {previewItem.name}
                </h3>
                <p className="text-sm font-bold text-[#0B7A6B] font-num">
                  {formatRupiah(previewItem.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-full bg-[#F5F7F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const photos =
                previewItem.images && previewItem.images.length > 0
                  ? previewItem.images
                  : previewItem.image
                    ? [previewItem.image]
                    : [];
              const current = photos[activePhotoIdx] ?? photos[0];
              return (
                <>
                  {current && (
                    <div className="aspect-4/3 w-full rounded-2xl overflow-hidden bg-[#FFF0E5]">
                      <img
                        src={current}
                        alt={previewItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {photos.map((ph, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePhotoIdx(i)}
                          className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                            i === activePhotoIdx
                              ? 'border-[#0F9D8A]'
                              : 'border-transparent opacity-70'
                          }`}
                        >
                          <img
                            src={ph}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {previewItem.description && (
              <p className="text-xs text-[#5B676D]">{previewItem.description}</p>
            )}
          </div>
        </div>
      )}

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
              <span className="font-num font-bold">
                {formatRupiah(subtotal)}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
