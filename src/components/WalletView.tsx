import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Smartphone, Wallet } from 'lucide-react';
import { formatRupiah, type WalletTransaction } from '../data/jalanKitaData';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallButton } from './PWAControls';

interface WalletViewProps {
  balance: number;
  transactions: WalletTransaction[];
  onTopUp: (amount: number) => void;
}

const TOPUP_PRESETS = [20000, 50000, 100000, 200000];

export function WalletView({
  balance,
  transactions,
  onTopUp,
}: WalletViewProps) {
  const [customAmount, setCustomAmount] = useState('');
  const { isInstalled, isInstallable, isIOS } = usePWAInstall();

  const handleCustomTopUp = () => {
    const parsed = parseInt(customAmount.replace(/\D/g, ''), 10);
    if (!Number.isNaN(parsed) && parsed >= 5000) {
      onTopUp(parsed);
      setCustomAmount('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#172124]">
          Dompet JK Pay
        </h1>
        <p className="text-xs sm:text-sm text-[#5B676D] mt-0.5">
          Kelola saldo untuk pembayaran cepat di seluruh layanan GoDrive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 space-y-4">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#0F9D8A] to-[#0B7A6B] text-white rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/85">
              <span>Saldo JK Pay aktif</span>
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-num">
              {formatRupiah(balance)}
            </div>
          </div>

          {/* Quick Top-Up */}
          <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
            <h2 className="text-sm font-bold text-[#172124]">Isi saldo cepat</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {TOPUP_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onTopUp(amt)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-[#DCE2E4] bg-white hover:bg-[#E3F5F2] hover:border-[#0F9D8A] hover:text-[#0B7A6B] text-sm font-semibold font-num text-[#172124] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#F0F3F4] space-y-2">
              <label
                htmlFor="wallet-custom"
                className="block text-xs font-medium text-[#5B676D]"
              >
                Nominal lainnya (minimal Rp5.000)
              </label>
              <div className="flex gap-2">
                <input
                  id="wallet-custom"
                  type="number"
                  inputMode="numeric"
                  min={5000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Contoh: 75000"
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE2E4] bg-white text-sm font-num text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
                />
                <button
                  type="button"
                  disabled={
                    !customAmount ||
                    Number.isNaN(parseInt(customAmount, 10)) ||
                    parseInt(customAmount, 10) < 5000
                  }
                  onClick={handleCustomTopUp}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>

            <p className="text-xs text-[#6B7780] leading-relaxed">
              Catatan prototipe: saldo, penempatan driver, dan pembayaran merupakan simulasi lokal.
            </p>
          </div>

          {!isInstalled && (
            <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-[#172124]">
                    Pasang GoDrive di Android &amp; iOS
                  </h2>
                  <p className="text-xs text-[#5B676D] leading-relaxed">
                    Tambahkan ke layar utama ponsel agar terbuka layar penuh tanpa bilah browser dan siap pakai lebih cepat.
                  </p>
                </div>
              </div>

              {(isInstallable || isIOS) ? (
                <PWAInstallButton variant="surface" />
              ) : (
                <p className="text-xs text-[#5B676D] bg-[#F5F7F7] rounded-xl p-3 leading-relaxed">
                  Android (Chrome): buka menu <strong className="font-semibold text-[#172124]">⋮</strong> lalu pilih <strong className="font-semibold text-[#172124]">Tambahkan ke layar utama</strong>. iPhone/iPad (Safari): ketuk <strong className="font-semibold text-[#172124]">Bagikan</strong> lalu pilih <strong className="font-semibold text-[#172124]">Tambah ke Layar Utama</strong>.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transaction Ledger */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-3">
          <h2 className="text-sm font-bold text-[#172124]">Mutasi JK Pay</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-[#5B676D] py-6 text-center">
              Belum ada transaksi pada sesi ini.
            </p>
          ) : (
            <div className="divide-y divide-[#F0F3F4]">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.kind === 'topup'
                          ? 'bg-[#E3F5F2] text-[#0B7A6B]'
                          : 'bg-[#F5F7F7] text-[#5B676D]'
                      }`}
                    >
                      {tx.kind === 'topup' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#172124] truncate">
                        {tx.label}
                      </div>
                      <div className="text-xs text-[#6B7780] font-num">
                        {tx.time}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold font-num whitespace-nowrap shrink-0 ${
                      tx.kind === 'topup' ? 'text-[#0B7A6B]' : 'text-[#172124]'
                    }`}
                  >
                    {tx.kind === 'topup' ? '+' : '−'}
                    {formatRupiah(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
