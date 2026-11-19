export type ServiceId = 'bike' | 'car' | 'food' | 'shop' | 'pickup' | 'sedekah';

export type RootTab = 'home' | 'act' | 'acc' | 'profile';

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

export interface RestaurantMenuItem {
  name: string;
  price: number;
  image?: string;
  images?: string[];
  description?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  eta: string;
  searchQuery: string;
  image?: string;
  items: RestaurantMenuItem[];
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
    name: 'Go Ride',
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

function makeDishIllustration(
  title: string,
  bgFrom: string,
  bgTo: string,
  accent: string,
  kind: 'soup' | 'grill' | 'drink' | 'banana' | 'chicken' | 'rice'
): string {
  const artwork: Record<typeof kind, string> = {
    soup: `
      <ellipse cx="100" cy="115" rx="62" ry="26" fill="#FFFFFF" opacity="0.95"/>
      <ellipse cx="100" cy="110" rx="54" ry="20" fill="${accent}"/>
      <circle cx="84" cy="108" r="9" fill="#6B3410"/>
      <circle cx="106" cy="113" r="10" fill="#7C3F16"/>
      <circle cx="118" cy="105" r="8" fill="#5A2B0C"/>
      <circle cx="92" cy="102" r="4" fill="#22C55E"/>
      <circle cx="110" cy="103" r="4" fill="#22C55E"/>
      <path d="M50 115 Q100 155 150 115" fill="#F1F5F9"/>
    `,
    grill: `
      <ellipse cx="100" cy="118" rx="64" ry="24" fill="#FFF7ED"/>
      <rect x="60" y="96" width="78" height="16" rx="8" fill="#5C240E" transform="rotate(-8 100 104)"/>
      <rect x="64" y="110" width="74" height="16" rx="8" fill="#7C2D12" transform="rotate(6 100 118)"/>
      <circle cx="80" cy="102" r="3" fill="#FDE047"/>
      <circle cx="118" cy="114" r="3.5" fill="#22C55E"/>
    `,
    drink: `
      <rect x="74" y="64" width="52" height="78" rx="10" fill="#FFFFFF" opacity="0.92"/>
      <rect x="78" y="76" width="44" height="62" rx="8" fill="${accent}"/>
      <rect x="84" y="82" width="12" height="12" rx="3" fill="#FFFFFF" opacity="0.7"/>
      <rect x="102" y="86" width="12" height="12" rx="3" fill="#FFFFFF" opacity="0.7"/>
      <path d="M108 46 L98 84" stroke="#1E293B" stroke-width="5" stroke-linecap="round"/>
    `,
    banana: `
      <ellipse cx="100" cy="122" rx="64" ry="22" fill="#FFFFFF" opacity="0.95"/>
      <path d="M58 116 Q100 84 142 114 Q102 132 58 116 Z" fill="#FACC15"/>
      <path d="M66 113 Q100 96 134 113" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="88" cy="108" r="3.5" fill="#FEF08A"/>
      <circle cx="112" cy="108" r="3.5" fill="#FEF08A"/>
    `,
    chicken: `
      <ellipse cx="100" cy="120" rx="64" ry="24" fill="#FFFFFF" opacity="0.95"/>
      <path d="M64 114 Q92 78 128 102 Q142 118 114 126 Q80 130 64 114 Z" fill="#D97706"/>
      <path d="M76 106 Q102 90 120 110" stroke="${accent}" stroke-width="9" stroke-linecap="round" fill="none"/>
      <circle cx="95" cy="106" r="3" fill="#FEF08A"/>
      <circle cx="108" cy="103" r="3" fill="#22C55E"/>
    `,
    rice: `
      <ellipse cx="100" cy="122" rx="60" ry="20" fill="#E2E8F0"/>
      <path d="M58 120 Q100 72 142 120 Z" fill="#FFFFFF"/>
      <circle cx="96" cy="96" r="2.5" fill="#22C55E"/>
      <circle cx="106" cy="99" r="2.5" fill="#16A34A"/>
    `,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 175" width="400" height="350">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgFrom}"/>
        <stop offset="100%" stop-color="${bgTo}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="175" fill="url(#g)"/>
    <circle cx="165" cy="30" r="38" fill="#FFFFFF" opacity="0.12"/>
    <circle cx="30" cy="150" r="45" fill="#FFFFFF" opacity="0.1"/>
    ${artwork[kind]}
    <rect x="14" y="14" width="172" height="24" rx="12" fill="#000000" opacity="0.28"/>
    <text x="100" y="30" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="700">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'f1',
    name: 'Coto Bugis Daeng',
    category: 'Coto',
    eta: '15 mnt',
    searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
    image: makeDishIllustration('Coto Bugis Daeng', '#9A3412', '#C2410C', '#B45309', 'soup'),
    items: [
      {
        name: 'Coto Daging',
        price: 28000,
        description: 'Kuah rempah khas Bugis dengan potongan daging sapi empuk',
        image: makeDishIllustration('Coto Daging Sapi', '#9A3412', '#EA580C', '#B45309', 'soup'),
      },
      {
        name: 'Coto + Ketupat',
        price: 32000,
        description: 'Paket lengkap Coto Daging hangat + 2 ketupat pandan',
        image: makeDishIllustration('Coto + Ketupat', '#7C2D12', '#C2410C', '#92400E', 'soup'),
      },
      {
        name: 'Konro Bakar',
        price: 55000,
        description: 'Iga sapi bakar bumbu kacang & kuah kaldu rempah',
        image: makeDishIllustration('Konro Bakar Spesial', '#451A03', '#9A3412', '#78350F', 'grill'),
      },
      {
        name: 'Es Teh',
        price: 6000,
        description: 'Es teh manis segar ukuran jumbo',
        image: makeDishIllustration('Es Teh Manis', '#B45309', '#F59E0B', '#D97706', 'drink'),
      },
    ],
  },
  {
    id: 'f2',
    name: 'Pisang Epe Palattae',
    category: 'Jajanan',
    eta: '10 mnt',
    searchQuery: 'Pasar Palattae, Kahu, Kabupaten Bone, Sulawesi Selatan',
    image: makeDishIllustration('Pisang Epe Palattae', '#B45309', '#D97706', '#78350F', 'banana'),
    items: [
      {
        name: 'Pisang Epe Coklat',
        price: 15000,
        description: 'Pisang kepok bakar pipih siram gula merah & coklat lumer',
        image: makeDishIllustration('Pisang Epe Coklat', '#78350F', '#B45309', '#451A03', 'banana'),
      },
      {
        name: 'Pisang Epe Keju',
        price: 18000,
        description: 'Pisang epe hangat dengan taburan keju parut melimpah',
        image: makeDishIllustration('Pisang Epe Keju', '#B45309', '#F59E0B', '#FEF08A', 'banana'),
      },
      {
        name: 'Es Pisang Ijo',
        price: 14000,
        description: 'Pisang balut adonan hijau pandan, bubur sumsum & sirup merah',
        image: makeDishIllustration('Es Pisang Ijo', '#0F766E', '#10B981', '#F43F5E', 'drink'),
      },
    ],
  },
  {
    id: 'f3',
    name: 'Ayam Geprek Kita',
    category: 'Ayam',
    eta: '20 mnt',
    searchQuery: 'Kantor Camat Kahu, Kabupaten Bone, Sulawesi Selatan',
    image: makeDishIllustration('Ayam Geprek Kita', '#B91C1C', '#EF4444', '#DC2626', 'chicken'),
    items: [
      {
        name: 'Geprek Original',
        price: 20000,
        description: 'Ayam crispy geprek sambal bawang pedas level 1-5',
        image: makeDishIllustration('Ayam Geprek Original', '#991B1B', '#DC2626', '#EF4444', 'chicken'),
      },
      {
        name: 'Geprek Keju',
        price: 24000,
        description: 'Ayam geprek pedas dengan topping saus keju gurih',
        image: makeDishIllustration('Ayam Geprek Keju', '#B45309', '#EA580C', '#FACC15', 'chicken'),
      },
      {
        name: 'Nasi Putih',
        price: 5000,
        description: 'Nasi putih pulen hangat',
        image: makeDishIllustration('Nasi Putih Hangat', '#0F766E', '#14B8A6', '#FFFFFF', 'rice'),
      },
      {
        name: 'Es Jeruk',
        price: 7000,
        description: 'Perasan jeruk segar dingin',
        image: makeDishIllustration('Es Jeruk Segar', '#C2410C', '#FB923C', '#F97316', 'drink'),
      },
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
