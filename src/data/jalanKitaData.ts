export type ServiceId = 'bike' | 'car' | 'food' | 'shop' | 'pickup' | 'sedekah';

export type RootTab = 'home' | 'act' | 'acc';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface PlacePreset {
  id: string;
  label: string;
  searchQuery: string;
}

export interface SelectedLocation {
  id: string;
  label: string;
  searchQuery: string;
  address?: string;
  coords: LatLngPoint | null;
}

export type ViewRoute =
  | { view: 'root' }
  | { view: 'ride'; service: 'bike' | 'car' }
  | { view: 'food' }
  | { view: 'menu'; restaurantId: string }
  | { view: 'shop' }
  | { view: 'checkout'; kind: 'food' | 'shop' }
  | { view: 'pickup' }
  | { view: 'sedekah' }
  | { view: 'campaign'; campaignId: string }
  | { view: 'track'; orderId: number };

export interface ServiceMeta {
  id: ServiceId;
  name: string;
  tagline: string;
  tintBg: string;
  tintText: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  eta: string;
  searchQuery: string;
  items: { name: string; price: number }[];
}

export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface SedekahCampaign {
  id: string;
  title: string;
  organizer: string;
  goal: number;
  collected: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'driver';
  text: string;
  time: string;
}

export interface OrderRecord {
  id: number;
  svc: ServiceId;
  label: string;
  amt: number;
  step: number;
  steps: string[];
  time: string;
  drv: [string, string];
  rate?: number;
  origin?: SelectedLocation;
  destination?: SelectedLocation;
  distanceKm?: number;
  durationMinutes?: number;
  messages?: ChatMessage[];
  extra?: {
    nearbyCount?: number;
    note?: string;
    detail?: string;
  };
}

export interface WalletTransaction {
  id: string;
  label: string;
  amount: number;
  kind: 'topup' | 'debit';
  time: string;
}

export const SERVICE_RADIUS_KM = 20;
export const SERVICE_CENTER = 'Pasar Palattae, Kahu, Bone';
export const SERVICE_CENTER_ID = 'pasar-palattae';

export const PRESET_PLACES: PlacePreset[] = [
  {
    id: 'pasar-palattae',
    label: 'Pasar Palattae',
    searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
  },
  {
    id: 'kantor-camat-kahu',
    label: 'Kantor Camat Kahu',
    searchQuery: 'Kantor Camat Kahu, Kabupaten Bone, Sulawesi Selatan',
  },
  {
    id: 'puskesmas-kahu',
    label: 'Puskesmas Kahu',
    searchQuery: 'Puskesmas Kahu, Kabupaten Bone, Sulawesi Selatan',
  },
  {
    id: 'sman-1-kahu',
    label: 'SMA Negeri 1 Kahu',
    searchQuery: 'SMA Negeri 1 Kahu, Kabupaten Bone, Sulawesi Selatan',
  },
  {
    id: 'rm-pesona-kampung',
    label: 'RM Pesona Kampung',
    searchQuery: 'RM Pesona Kampung, Kahu, Kabupaten Bone, Sulawesi Selatan',
  },
  {
    id: 'pasar-sentral-palakka',
    label: 'Pasar Sentral Palakka (luar area)',
    searchQuery: 'Pasar Sentral Palakka, Kabupaten Bone, Sulawesi Selatan',
  },
];

// Nearby driver offset vectors (km from pickup location) used for visual fleet radar
export const DRIVER_OFFSET_KM: [number, number][] = [
  [0.35, 0.25],
  [1.2, -0.8],
  [-0.9, 0.55],
  [2.4, 1.3],
];

export const SERVICES: ServiceMeta[] = [
  {
    id: 'bike',
    name: 'Go Bike',
    tagline: 'Ojek cepat dalam kecamatan',
    tintBg: 'bg-[#E3F5F2]',
    tintText: 'text-[#0B7A6B]',
  },
  {
    id: 'car',
    name: 'Go Car',
    tagline: 'Tumpangan mobil nyaman',
    tintBg: 'bg-[#E6F0FC]',
    tintText: 'text-[#1D5CA8]',
  },
  {
    id: 'food',
    name: 'Go Food',
    tagline: 'Kuliner hangat sekitar Kahu',
    tintBg: 'bg-[#FFF0E5]',
    tintText: 'text-[#C4510A]',
  },
  {
    id: 'shop',
    name: 'Go Shop',
    tagline: 'Kebutuhan harian & aksesori',
    tintBg: 'bg-[#F5E8F4]',
    tintText: 'text-[#862E83]',
  },
  {
    id: 'pickup',
    name: 'Go Pick up',
    tagline: 'Kurir dokumen & titipan',
    tintBg: 'bg-[#FDF4DC]',
    tintText: 'text-[#9A6700]',
  },
  {
    id: 'sedekah',
    name: 'Go Sedekah',
    tagline: 'Berbagi untuk warga sekitar',
    tintBg: 'bg-[#EAF6E1]',
    tintText: 'text-[#2D6E1E]',
  },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'f1',
    name: 'Coto Bugis Daeng',
    category: 'Coto',
    eta: '15 mnt',
    searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
    items: [
      { name: 'Coto Daging', price: 28000 },
      { name: 'Coto + Ketupat', price: 32000 },
      { name: 'Konro Bakar', price: 55000 },
      { name: 'Es Teh', price: 6000 },
    ],
  },
  {
    id: 'f2',
    name: 'Pisang Epe Palattae',
    category: 'Jajanan',
    eta: '10 mnt',
    searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
    items: [
      { name: 'Pisang Epe Coklat', price: 15000 },
      { name: 'Pisang Epe Keju', price: 18000 },
      { name: 'Es Pisang Ijo', price: 14000 },
    ],
  },
  {
    id: 'f3',
    name: 'Ayam Geprek Kita',
    category: 'Ayam',
    eta: '20 mnt',
    searchQuery: 'Kantor Camat Kahu, Kabupaten Bone, Sulawesi Selatan',
    items: [
      { name: 'Geprek Original', price: 20000 },
      { name: 'Geprek Keju', price: 24000 },
      { name: 'Nasi Putih', price: 5000 },
      { name: 'Es Jeruk', price: 7000 },
    ],
  },
];

export const SHOP_ITEMS: ShopProduct[] = [
  { id: 's1', name: 'Earphone Bluetooth', category: 'Audio', price: 129000 },
  { id: 's2', name: 'Power Bank 10.000mAh', category: 'Daya', price: 149000 },
  { id: 's3', name: 'Kaos Polos Katun', category: 'Sandang', price: 65000 },
  { id: 's4', name: 'Botol Minum 1L', category: 'Harian', price: 45000 },
  { id: 's5', name: 'Tas Ransel Harian', category: 'Tas', price: 185000 },
  { id: 's6', name: 'Lampu Meja LED', category: 'Rumah', price: 79000 },
];

export const INITIAL_CAMPAIGNS: SedekahCampaign[] = [
  {
    id: 'c1',
    title: 'Makan Gratis untuk Lansia',
    organizer: 'Yayasan Peduli Sesama',
    goal: 20000000,
    collected: 12450000,
  },
  {
    id: 'c2',
    title: 'Beasiswa Anak Pesisir',
    organizer: 'Komunitas Sulsel Berbagi',
    goal: 50000000,
    collected: 31200000,
  },
  {
    id: 'c3',
    title: 'Sumur Bersih Desa',
    organizer: 'Aksi Air Bersih',
    goal: 30000000,
    collected: 9800000,
  },
  {
    id: 'c4',
    title: 'Sedekah Subuh Jumat',
    organizer: 'Masjid Al-Markaz',
    goal: 5000000,
    collected: 3900000,
  },
];

export const DRIVER_ROSTER: [string, string][] = [
  ['Andi Pratama', 'DD 4521 AB'],
  ['Budi Santoso', 'DD 1288 CF'],
  ['Rahmat Hidayat', 'DD 7790 KL'],
  ['Sri Wahyuni', 'DD 3304 MN'],
];

export const SERVICE_STEPS: Record<ServiceId, string[]> = {
  bike: ['Mencari driver', 'Driver menuju lokasimu', 'Dalam perjalanan', 'Sampai tujuan'],
  car: ['Mencari driver', 'Driver menuju lokasimu', 'Dalam perjalanan', 'Sampai tujuan'],
  food: ['Restoran menerima pesanan', 'Makanan disiapkan', 'Driver mengantar', 'Pesanan tiba'],
  shop: ['Pesanan dikonfirmasi', 'Dikemas penjual', 'Driver mengantar', 'Paket tiba'],
  pickup: ['Mencari driver', 'Driver menjemput barang', 'Barang diantar', 'Barang diterima'],
  sedekah: ['Diterima'],
};

export function formatRupiah(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export function roundUp500(value: number): number {
  return Math.ceil(value / 500) * 500;
}

export function haversineKm(a: LatLngPoint, b: LatLngPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function offsetPointByKm(
  origin: LatLngPoint,
  eastKm: number,
  northKm: number
): LatLngPoint {
  const dLat = northKm / 111.32;
  const dLng = eastKm / (111.32 * Math.cos((origin.lat * Math.PI) / 180));
  return {
    lat: origin.lat + dLat,
    lng: origin.lng + dLng,
  };
}

export function computeBearingDegrees(from: LatLngPoint, to: LatLngPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function interpolateAlongPath(
  path: LatLngPoint[],
  progress: number
): { position: LatLngPoint; heading: number } | null {
  if (path.length === 0) return null;
  if (path.length === 1) return { position: path[0], heading: 0 };

  const clamped = Math.max(0, Math.min(1, progress));
  const segLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const seg = haversineKm(path[i], path[i + 1]);
    segLengths.push(seg);
    totalLength += seg;
  }

  if (totalLength === 0) {
    return { position: path[0], heading: 0 };
  }

  let targetDist = clamped * totalLength;
  for (let i = 0; i < segLengths.length; i++) {
    const seg = segLengths[i];
    if (targetDist <= seg || i === segLengths.length - 1) {
      const ratio = seg > 0 ? Math.min(1, targetDist / seg) : 0;
      const start = path[i];
      const end = path[i + 1];
      return {
        position: {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio,
        },
        heading: computeBearingDegrees(start, end),
      };
    }
    targetDist -= seg;
  }

  return {
    position: path[path.length - 1],
    heading: computeBearingDegrees(path[path.length - 2], path[path.length - 1]),
  };
}

export function buildGoogleMapsDirectionsUrl(
  from: SelectedLocation,
  to: SelectedLocation,
  travelMode: 'driving' | 'two-wheeler'
): string {
  const encodeLoc = (loc: SelectedLocation) =>
    loc.coords
      ? `${loc.coords.lat},${loc.coords.lng}`
      : encodeURIComponent(loc.searchQuery);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeLoc(from)}&destination=${encodeLoc(to)}&travelmode=${travelMode}`;
}

export function formatTimeNow(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildInitialDriverGreeting(order: OrderRecord): string {
  const [driverName, plate] = order.drv;
  const pickupLabel = order.origin?.label;

  if (order.svc === 'pickup') {
    return pickupLabel
      ? `Halo, saya ${driverName} (${plate}). Saya otw ke ${pickupLabel} untuk menjemput barang ya.`
      : `Halo, saya ${driverName} (${plate}). Saya sedang menuju titik jemput barang sekarang.`;
  }
  if (order.svc === 'food' || order.svc === 'shop') {
    return `Halo, saya ${driverName} (${plate}). Pesanan Anda sedang diproses, kabari jika ada patokan lokasi pengantaran.`;
  }
  return pickupLabel
    ? `Halo, saya ${driverName} (${plate}). Saya menuju ${pickupLabel} sekarang. Titik jemput sudah sesuai?`
    : `Halo, saya ${driverName} (${plate}). Saya sedang menuju lokasi jemput Anda ya.`;
}

export function buildDriverChatReply(
  order: OrderRecord,
  userMessage: string
): string {
  const lower = userMessage.toLowerCase();
  const pickupLabel = order.origin?.label ?? 'titik jemput';

  if (
    lower.includes('posisi') ||
    lower.includes('mana') ||
    lower.includes('lama') ||
    lower.includes('sampai')
  ) {
    if (order.step <= 1) {
      return `Saya sudah dekat area ${pickupLabel}, sekitar 2–3 menit lagi tiba di lokasi.`;
    }
    return `Posisi saya sudah bergerak mengikuti rute Google Maps menuju tujuan, mohon ditunggu ya.`;
  }

  if (
    lower.includes('gerbang') ||
    lower.includes('depan') ||
    lower.includes('pagar') ||
    lower.includes('pinggir') ||
    lower.includes('tunggu') ||
    lower.includes('luar')
  ) {
    return `Siap, terima kasih infonya! Saya langsung merapat ke depan ${pickupLabel} sesuai patokan Anda.`;
  }

  if (
    lower.includes('sesuai') ||
    lower.includes('peta') ||
    lower.includes('maps') ||
    lower.includes('benar') ||
    lower.includes('ok') ||
    lower.includes('oke') ||
    lower.includes('siap')
  ) {
    return `Baik, titik sudah sesuai di peta. Saya segera tiba, pakai jaket & helm GoDrive warna hijau toska ya.`;
  }

  if (
    lower.includes('baju') ||
    lower.includes('jaket') ||
    lower.includes('helm') ||
    lower.includes('warna') ||
    lower.includes('ciri')
  ) {
    return `Siap dicatat ciri-cirinya. Kendaraan saya bernomor polisi ${order.drv[1]}.`;
  }

  if (lower.includes('terima kasih') || lower.includes('makasih')) {
    return `Sama-sama! Kabari saja lewat chat ini jika ada patokan tambahan.`;
  }

  return `Siap, pesan diterima. Saya sedang menuju ${pickupLabel} dengan kendaraan ${order.drv[1]}.`;
}

export function isQuotaOrAuthError(err: unknown): boolean {
  const msg = String(
    (err as { message?: string; status?: string; code?: number })?.message ??
      err ??
      ''
  ).toUpperCase();
  const status = String(
    (err as { status?: string; code?: number })?.status ?? ''
  ).toUpperCase();
  const code = (err as { code?: number })?.code;
  return (
    code === 429 ||
    status === 'OVER_QUERY_LIMIT' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QUOTA') ||
    msg.includes('429')
  );
}
