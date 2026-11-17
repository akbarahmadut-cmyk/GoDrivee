import { AlertCircle, Tag } from 'lucide-react';
import {
  SERVICE_RADIUS_KM,
  formatRupiah,
  haversineKm,
  type LatLngPoint,
  type SelectedLocation,
} from '../data/jalanKitaData';
import { LocationPickerField } from './LocationPickerField';

interface CheckoutLineItem {
  name: string;
  price: number;
  qty: number;
}

interface CheckoutViewProps {
  kind: 'food' | 'shop';
  title: string;
  items: CheckoutLineItem[];
  address: SelectedLocation;
  serviceCenterCoords: LatLngPoint | null;
  firstDeliveryPromoAvailable: boolean;
  onSelectPresetAddress: (presetId: string) => void;
  onSelectCustomAddress: (loc: SelectedLocation) => void;
  onPlaceOrder: (total: number, usedPromo: boolean) => void;
  onShowToast: (msg: string) => void;
}

export function CheckoutView({
  kind,
  title,
  items,
  address,
  serviceCenterCoords,
  firstDeliveryPromoAvailable,
  onSelectPresetAddress,
  onSelectCustomAddress,
  onPlaceOrder,
  onShowToast,
}: CheckoutViewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const baseShipping = kind === 'food' ? 8000 : 10000;
  const promoDiscount = firstDeliveryPromoAvailable ? baseShipping * 0.5 : 0;
  const finalShipping = baseShipping - promoDiscount;
  const total = subtotal + finalShipping;

  const outOfArea =
    (serviceCenterCoords &&
      address.coords &&
      haversineKm(serviceCenterCoords, address.coords) > SERVICE_RADIUS_KM) ||
    address.id === 'pasar-sentral-palakka';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-3">
          <div className="text-sm font-bold text-[#172124]">
            Ringkasan {title}
          </div>
          <div className="divide-y divide-[#F0F3F4]">
            {items.map((item) => (
              <div
                key={item.name}
                className="py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-[#172124]">
                  <span className="font-semibold font-num">{item.qty}×</span>{' '}
                  {item.name}
                </span>
                <span className="font-medium font-num text-[#172124]">
                  {formatRupiah(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA]">
          <LocationPickerField
            id="checkout-addr"
            label="Alamat pengantaran"
            value={address}
            biasCenter={serviceCenterCoords}
            onSelectPreset={onSelectPresetAddress}
            onSelectCustom={onSelectCustomAddress}
            onError={onShowToast}
          />
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
          <h2 className="text-base font-bold text-[#172124]">
            Rincian Pembayaran
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#5B676D]">
              <span>Subtotal</span>
              <span className="font-num text-[#172124]">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5B676D]">
              <span>Ongkir</span>
              <span className="font-num text-[#172124]">
                {formatRupiah(baseShipping)}
              </span>
            </div>
            {firstDeliveryPromoAvailable && (
              <div className="flex justify-between text-[#0B7A6B] font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Diskon 50% ongkir pertama
                </span>
                <span className="font-num">−{formatRupiah(promoDiscount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-[#ECEFEF] flex justify-between text-base font-bold text-[#172124]">
              <span>Total bayar</span>
              <span className="font-num">{formatRupiah(total)}</span>
            </div>
          </div>

          {outOfArea && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FDF2F2] border border-[#F5C6C7] text-xs text-[#B4232A]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Alamat pengantaran di luar area layanan (radius {SERVICE_RADIUS_KM} km).
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={Boolean(outOfArea) || items.length === 0}
            onClick={() => onPlaceOrder(total, firstDeliveryPromoAvailable)}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white text-sm sm:text-base font-semibold transition-all cursor-pointer"
          >
            Bayar dengan JK Pay · {formatRupiah(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
