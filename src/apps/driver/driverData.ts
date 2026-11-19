import {
  haversineKm,
  offsetPointByKm,
  type LatLngPoint,
} from '../../data/jalanKitaData';

export type ServiceKind = 'Go Ride' | 'Go Car' | 'Go Food' | 'Go Pickup' | 'Go Shop';
export type VehicleType = 'Motor' | 'Mobil';
export type JobPhase = 'to_pickup' | 'to_dropoff' | 'done';

export interface JobPlace {
  label: string;
  query: string;
  coords: LatLngPoint;
}

export interface ChatMsg {
  from: 'driver' | 'customer';
  text: string;
  time: number;
}

export interface DriverJob {
  id: string;
  service: ServiceKind;
  customer: { name: string; rating: number };
  pickup: JobPlace;
  dropoff: JobPlace;
  distanceKm: number;
  fare: number;
  payment: 'Tunai' | 'JK Pay';
  note?: string;
  createdAt: number;
  completedAt?: number;
  phase: JobPhase;
  chat: ChatMsg[];
}

export interface WalletTx {
  id: string;
  kind: 'earning' | 'commission' | 'withdraw' | 'initial';
  amount: number; // positif = masuk, negatif = keluar
  label: string;
  time: number;
}

export interface Review {
  id: string;
  jobId: string;
  customer: string;
  rating: number;
  comment: string;
  time: number;
}

export type VerifyStatus = 'none' | 'pending' | 'verified';

export interface Registration {
  status: VerifyStatus;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  plate: string;
  bankName: string;
  bankAccount: string;
  docs: { ktp?: string; sim?: string; stnk?: string };
}

export interface DriverSettings {
  sound: boolean;
  vibrate: boolean;
  autoOffers: boolean;
}

export const COMMISSION_RATE = 0.2;
export const MIN_WITHDRAW = 10000;
export const OFFER_TIMEOUT_S = 15;

// Perkiraan pusat Kecamatan Kahu, Kabupaten Bone (dipakai jika GPS tidak tersedia).
export const KAHU_CENTER: LatLngPoint = { lat: -4.7, lng: 120.2 };

export const EMPTY_REGISTRATION: Registration = {
  status: 'none',
  name: '',
  phone: '',
  vehicleType: 'Motor',
  vehicleModel: '',
  plate: '',
  bankName: '',
  bankAccount: '',
  docs: {},
};

export const SERVICES_BY_VEHICLE: Record<VehicleType, ServiceKind[]> = {
  Motor: ['Go Ride', 'Go Food', 'Go Pickup', 'Go Shop'],
  Mobil: ['Go Car', 'Go Pickup'],
};

// ---- Data contoh (simulasi) — diganti backend nanti ----
const PLACES = [
  'Pasar Palattae',
  'Kantor Camat Kahu',
  'Puskesmas Kahu',
  'SMA Negeri 1 Kahu',
  'RM Pesona Kampung',
  'Masjid Raya Palattae',
  'SD Negeri 1 Kahu',
  'Lapangan Palattae',
];
const FOOD_PLACES = ['RM Pesona Kampung', 'Warung Coto Daeng', 'Kedai Kopi Kahu'];
const SHOP_PLACES = ['Toko Sembako Palattae', 'Minimarket Kahu'];
const CUSTOMERS = ['Andi', 'Besse', 'Rahmat', 'Nurul', 'Ilham', 'Sitti', 'Fajar', 'Dewi'];
const NOTES = ['', '', 'Rumah pagar hijau', 'Depan masjid', 'Tolong cepat ya', 'Telepon kalau sudah dekat'];

const toQuery = (label: string) => `${label}, Kahu, Kabupaten Bone, Sulawesi Selatan`;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function priceFor(service: ServiceKind, km: number) {
  const table: Record<ServiceKind, [number, number]> = {
    'Go Ride': [8000, 2500],
    'Go Car': [15000, 4500],
    'Go Food': [7000, 2500],
    'Go Shop': [7000, 2500],
    'Go Pickup': [8000, 2500],
  };
  const [base, perKm] = table[service];
  return Math.round((base + perKm * km) / 500) * 500;
}

export function generateJob(driverPos: LatLngPoint, vehicle: VehicleType): DriverJob {
  const service = pick(SERVICES_BY_VEHICLE[vehicle]);
  const pickupLabel =
    service === 'Go Food' ? pick(FOOD_PLACES) : service === 'Go Shop' ? pick(SHOP_PLACES) : pick(PLACES);
  let dropLabel = pick(PLACES);
  while (dropLabel === pickupLabel) dropLabel = pick(PLACES);

  const pickupCoords = offsetPointByKm(driverPos, rand(-1.5, 1.5), rand(-1.5, 1.5));
  const dropCoords = offsetPointByKm(pickupCoords, rand(-4, 4), rand(-4, 4));
  const distanceKm = Math.max(1, haversineKm(pickupCoords, dropCoords) * 1.3);

  return {
    id: `J${Date.now()}`,
    service,
    customer: { name: pick(CUSTOMERS), rating: Math.round(rand(4.3, 5) * 10) / 10 },
    pickup: { label: pickupLabel, query: toQuery(pickupLabel), coords: pickupCoords },
    dropoff: { label: dropLabel, query: toQuery(dropLabel), coords: dropCoords },
    distanceKm,
    fare: priceFor(service, distanceKm),
    payment: Math.random() < 0.5 ? 'Tunai' : 'JK Pay',
    note: pick(NOTES) || undefined,
    createdAt: Date.now(),
    phase: 'to_pickup',
    chat: [],
  };
}

const REVIEW_COMMENTS: Record<number, string[]> = {
  5: ['Driver ramah dan cepat!', 'Mantap, aman sampai tujuan.', 'Sangat membantu, terima kasih.', ''],
  4: ['Bagus, sedikit telat.', 'Oke, terima kasih.', ''],
  3: ['Lumayan.', 'Agak lama menunggu.'],
};

export function generateReview(job: DriverJob): Review {
  const r = Math.random();
  const rating = r < 0.7 ? 5 : r < 0.93 ? 4 : 3;
  return {
    id: `R${Date.now()}`,
    jobId: job.id,
    customer: job.customer.name,
    rating,
    comment: pick(REVIEW_COMMENTS[rating]),
    time: Date.now(),
  };
}

export const QUICK_REPLIES = [
  'Saya menuju lokasi jemput ya.',
  'Saya sudah sampai di titik jemput.',
  'Mohon ditunggu sebentar.',
  'Pesanan sedang disiapkan.',
  'Saya sudah dekat lokasi tujuan.',
];

const CUSTOMER_REPLIES = [
  'Oke pak, saya tunggu.',
  'Siap, terima kasih.',
  'Saya di depan ya.',
  'Baik, hati-hati di jalan.',
  'Oke, sebentar saya keluar.',
];

export const randomCustomerReply = () => pick(CUSTOMER_REPLIES);

/** Tautan navigasi turn-by-turn ke aplikasi Google Maps (tidak butuh API key). */
export function navigationUrl(destQuery: string, origin?: LatLngPoint | null) {
  const params = new URLSearchParams({
    api: '1',
    destination: destQuery,
    travelmode: 'driving',
    dir_action: 'navigate',
  });
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export const commissionOf = (fare: number) => Math.round(fare * COMMISSION_RATE);

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatTime(t: number) {
  return new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
