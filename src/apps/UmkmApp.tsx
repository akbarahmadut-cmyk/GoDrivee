import { useState } from 'react';
import {
  ClipboardList,
  ImagePlus,
  Package,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { formatRupiah } from '../data/jalanKitaData';
import { useLocalState } from '../hooks/useLocalState';
import { RoleMap } from '../components/RoleMap';
import { PWAInstallButton } from '../components/PWAControls';
import { Card, Field, PartnerShell, Stat, SwitchAppLinks } from './PartnerShell';
import { PartnerAuthView, type PartnerSession } from './PartnerAuthView';

type UmkmTab = 'orders' | 'products' | 'store';

const MAX_IMAGES = 5;

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
  images?: string[];
}

interface UmkmOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: 'baru' | 'diproses' | 'siap' | 'selesai';
}

interface StoreProfile {
  name: string;
  category: string;
  phone: string;
  open: boolean;
  images?: string[];
}

const NEXT_STATUS: Record<UmkmOrder['status'], UmkmOrder['status'] | null> = {
  baru: 'diproses',
  diproses: 'siap',
  siap: 'selesai',
  selesai: null,
};

const STATUS_ACTION: Record<UmkmOrder['status'], string> = {
  baru: 'Terima & proses',
  diproses: 'Tandai siap diambil',
  siap: 'Sudah diambil driver',
  selesai: '',
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nasi Kuning', price: 15000, available: true, images: [] },
  { id: 'p2', name: 'Coto Makassar', price: 20000, available: true, images: [] },
  { id: 'p3', name: 'Es Teh Manis', price: 5000, available: true, images: [] },
];

const SAMPLE_CUSTOMERS = ['Andi', 'Besse', 'Rahmat', 'Nurul', 'Ilham'];

/** Baca & kompres file gambar menjadi Data URL kecil agar muat di localStorage. */
function readImageAsCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const MAX_DIM = 420;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function FiveImagesUploader({
  label,
  images,
  onChange,
  onLimitToast,
}: {
  label: string;
  images: string[];
  onChange: (next: string[]) => void;
  onLimitToast: (msg: string) => void;
}) {
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      onLimitToast(`Maksimal ${MAX_IMAGES} gambar.`);
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    if (fileList.length > remaining) {
      onLimitToast(`Hanya ${remaining} gambar lagi yang bisa ditambahkan (maks. ${MAX_IMAGES}).`);
    }
    const urls: string[] = [];
    for (const f of files) {
      try {
        const url = await readImageAsCompressedDataUrl(f);
        urls.push(url);
      } catch {
        // lewati file rusak
      }
    }
    if (urls.length > 0) {
      onChange([...images, ...urls].slice(0, MAX_IMAGES));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#5B676D]">{label}</span>
        <span className="font-bold text-[#C4510A]">
          {images.length}/{MAX_IMAGES} foto
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: MAX_IMAGES }).map((_, idx) => {
          const img = images[idx];
          if (img) {
            return (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#E4E8EA] bg-[#F5F7F7]"
              >
                <img
                  src={img}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Hapus foto ${idx + 1}`}
                  onClick={() =>
                    onChange(images.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <label
              key={idx}
              className="aspect-square rounded-xl border border-dashed border-[#DCE2E4] bg-[#F5F7F7] hover:bg-[#FFF1E6]/50 flex flex-col items-center justify-center gap-0.5 text-[#5B676D] hover:text-[#C4510A] cursor-pointer transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              <span className="text-[10px] font-semibold">Foto {idx + 1}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function UmkmApp({ onBack }: { onBack?: () => void }) {
  const [session, setSession] = useLocalState<PartnerSession | null>(
    'gd-umkm-session',
    null
  );
  const [products, setProducts] = useLocalState<Product[]>(
    'gd-umkm-products',
    DEFAULT_PRODUCTS
  );
  const [orders, setOrders] = useLocalState<UmkmOrder[]>('gd-umkm-orders', []);
  const [store, setStore] = useLocalState<StoreProfile>('gd-umkm-store', {
    name: 'Warung Kahu',
    category: 'Makanan & Minuman',
    phone: '',
    open: false,
    images: [],
  });
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);

  const goBack =
    onBack ??
    (() => {
      window.location.href = '/';
    });

  if (!session) {
    return (
      <PartnerAuthView
        role="umkm"
        onBack={goBack}
        onSuccess={(sess) => {
          setSession(sess);
          setStore((prev) => ({
            ...prev,
            name:
              prev.name === 'Warung Kahu' && sess.name ? sess.name : prev.name,
            phone: prev.phone || sess.phone,
          }));
        }}
      />
    );
  }

  const done = orders.filter((o) => o.status === 'selesai');
  const revenue = done.reduce((s, o) => s + o.total, 0);

  return (
    <PartnerShell<UmkmTab>
      appName="GoDrive Mitra Pedagang"
      subtitle="Aplikasi mitra usaha"
      accent="#C4510A"
      onBack={goBack}
      onLogout={() => setSession(null)}
      tabs={[
        { key: 'orders', label: 'Pesanan', icon: ClipboardList },
        { key: 'products', label: 'Produk', icon: UtensilsCrossed },
        { key: 'store', label: 'Toko', icon: Store },
      ]}
      render={(tab, toast) => {
        const simulateOrder = () => {
          if (!store.open) {
            toast('Buka toko dulu agar bisa menerima pesanan.');
            return;
          }
          const avail = products.filter((p) => p.available);
          if (avail.length === 0) {
            toast('Tidak ada produk yang tersedia.');
            return;
          }
          const pick = avail[Math.floor(Math.random() * avail.length)];
          const qty = 1 + Math.floor(Math.random() * 3);
          setOrders((prev) => [
            {
              id: `U${Date.now()}`,
              customer:
                SAMPLE_CUSTOMERS[
                  Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)
                ],
              items: `${qty}x ${pick.name}`,
              total: qty * pick.price,
              status: 'baru',
            },
            ...prev,
          ]);
          toast('Pesanan baru masuk!');
        };

        if (tab === 'orders') {
          const active = orders.filter((o) => o.status !== 'selesai');
          return (
            <div className="space-y-4">
              <Card className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">{store.name}</h2>
                    <p className="text-xs text-[#5B676D]">
                      Toko {store.open ? 'sedang buka' : 'sedang tutup'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStore({ ...store, open: !store.open })}
                    className={`min-h-[44px] px-5 rounded-xl text-sm font-semibold cursor-pointer ${
                      store.open
                        ? 'bg-[#FFF1E6] text-[#C4510A]'
                        : 'bg-[#FF7A1A] text-white'
                    }`}
                  >
                    {store.open ? 'Tutup Toko' : 'Buka Toko'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat value={active.length} label="Aktif" />
                  <Stat value={done.length} label="Selesai" />
                  <Stat value={formatRupiah(revenue)} label="Omzet" />
                </div>
              </Card>

              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Pesanan aktif</h3>
                  <button
                    type="button"
                    onClick={simulateOrder}
                    className="text-xs font-semibold text-[#C4510A] hover:underline cursor-pointer"
                  >
                    + Simulasikan pesanan
                  </button>
                </div>
                {active.length === 0 ? (
                  <p className="text-xs text-[#5B676D]">
                    Belum ada pesanan aktif.
                  </p>
                ) : (
                  active.map((o) => {
                    const next = NEXT_STATUS[o.status];
                    return (
                      <div
                        key={o.id}
                        className="rounded-xl border border-[#E4E8EA] p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {o.customer}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-[#C4510A]">
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B676D]">
                          {o.items} · {formatRupiah(o.total)}
                        </p>
                        {next && (
                          <button
                            type="button"
                            onClick={() =>
                              setOrders((prev) =>
                                prev.map((x) =>
                                  x.id === o.id ? { ...x, status: next } : x
                                )
                              )
                            }
                            className="w-full min-h-[40px] rounded-xl bg-[#FF7A1A] text-white text-xs font-semibold cursor-pointer"
                          >
                            {STATUS_ACTION[o.status]}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </Card>
            </div>
          );
        }

        if (tab === 'products') {
          const addProduct = () => {
            const price = parseInt(newPrice.replace(/\D/g, ''), 10);
            if (!newName.trim() || Number.isNaN(price) || price <= 0) {
              toast('Isi nama dan harga produk dengan benar.');
              return;
            }
            setProducts((prev) => [
              ...prev,
              {
                id: `p${Date.now()}`,
                name: newName.trim(),
                price,
                available: true,
                images: newImages.slice(0, MAX_IMAGES),
              },
            ]);
            setNewName('');
            setNewPrice('');
            setNewImages([]);
            toast('Produk beserta gambar berhasil ditambahkan.');
          };

          return (
            <div className="space-y-4">
              <Card className="space-y-3">
                <h2 className="text-sm font-bold">Daftar produk</h2>
                {products.length === 0 && (
                  <p className="text-xs text-[#5B676D]">Belum ada produk.</p>
                )}
                {products.map((p) => {
                  const imgs = p.images ?? [];
                  return (
                    <div
                      key={p.id}
                      className="border-b border-[#F0F3F4] pb-3 last:border-0 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        {imgs[0] ? (
                          <img
                            src={imgs[0]}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E4E8EA] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#FFF1E6] text-[#C4510A] flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              p.available ? '' : 'text-[#9AA5AA] line-through'
                            }`}
                          >
                            {p.name}
                          </p>
                          <p className="text-xs text-[#5B676D] font-num">
                            {formatRupiah(p.price)} · {imgs.length}/{MAX_IMAGES}{' '}
                            gambar
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProducts((prev) =>
                              prev.map((x) =>
                                x.id === p.id
                                  ? { ...x, available: !x.available }
                                  : x
                              )
                            )
                          }
                          className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                            p.available
                              ? 'bg-[#E6F6F3] text-[#0B7A6B]'
                              : 'bg-[#F5F7F7] text-[#5B676D]'
                          }`}
                        >
                          {p.available ? 'Tersedia' : 'Habis'}
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${p.name}`}
                          onClick={() =>
                            setProducts((prev) =>
                              prev.filter((x) => x.id !== p.id)
                            )
                          }
                          className="min-h-[36px] px-2 text-[#9AA5AA] hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Slot 5 gambar per produk */}
                      <FiveImagesUploader
                        label={`Foto produk "${p.name}" (maks. 5 gambar)`}
                        images={imgs}
                        onLimitToast={toast}
                        onChange={(nextImgs) =>
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, images: nextImgs } : x
                            )
                          )
                        }
                      />
                    </div>
                  );
                })}
              </Card>

              <Card className="space-y-3">
                <h3 className="text-sm font-bold">Tambah produk baru</h3>
                <Field
                  label="Nama produk"
                  value={newName}
                  onChange={setNewName}
                />
                <Field
                  label="Harga (Rp)"
                  value={newPrice}
                  onChange={setNewPrice}
                  type="number"
                />
                <FiveImagesUploader
                  label="Unggah gambar produk (maksimal 5 gambar)"
                  images={newImages}
                  onChange={setNewImages}
                  onLimitToast={toast}
                />
                <button
                  type="button"
                  onClick={addProduct}
                  className="w-full min-h-[44px] rounded-xl bg-[#FF7A1A] text-white text-sm font-semibold cursor-pointer"
                >
                  Simpan produk
                </button>
              </Card>
            </div>
          );
        }

        const storeImages = store.images ?? [];

        return (
          <div className="space-y-4">
            <Card className="space-y-3">
              <h2 className="text-sm font-bold">Profil & Galeri Toko</h2>
              <Field
                label="Nama toko"
                value={store.name}
                onChange={(v) => setStore({ ...store, name: v })}
              />
              <Field
                label="Kategori"
                value={store.category}
                onChange={(v) => setStore({ ...store, category: v })}
              />
              <Field
                label="No. WhatsApp"
                value={store.phone}
                onChange={(v) => setStore({ ...store, phone: v })}
                type="tel"
              />
              <FiveImagesUploader
                label="Galeri foto toko / etalase (maksimal 5 gambar)"
                images={storeImages}
                onLimitToast={toast}
                onChange={(nextImgs) =>
                  setStore({ ...store, images: nextImgs })
                }
              />
            </Card>
            <Card>
              <h3 className="text-sm font-bold mb-3">Lokasi toko</h3>
              <RoleMap label="Tandai lokasi toko saya" pinColor="#FF7A1A" />
            </Card>
            <PWAInstallButton />
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="w-full min-h-[48px] rounded-2xl border border-[#E4E8EA] bg-white text-sm font-bold text-[#172124] cursor-pointer"
              >
                ← Kembali ke Aplikasi Pelanggan
              </button>
            ) : (
              <SwitchAppLinks current="umkm" />
            )}
          </div>
        );
      }}
    />
  );
}
