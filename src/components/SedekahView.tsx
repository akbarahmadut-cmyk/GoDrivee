import { useState } from 'react';
import { ChevronRight, HeartHandshake } from 'lucide-react';
import { formatRupiah, type SedekahCampaign } from '../data/jalanKitaData';
import { CampaignIcon } from './ServiceIcon';

interface SedekahListViewProps {
  giving: number;
  campaigns: SedekahCampaign[];
  onSelectCampaign: (campaignId: string) => void;
}

export function SedekahListView({
  giving,
  campaigns,
  onSelectCampaign,
}: SedekahListViewProps) {
  return (
    <div className="space-y-5">
      <div className="bg-[#E3F5F2] border border-[#CBE5DF] rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#0B7A6B]">Total sedekahmu</div>
          <div className="text-2xl sm:text-3xl font-bold font-num text-[#172124] mt-1">
            {formatRupiah(giving)}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white text-[#0B7A6B] flex items-center justify-center shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {campaigns.map((camp) => {
          const pct = Math.min(100, Math.round((camp.collected / camp.goal) * 100));
          return (
            <button
              key={camp.id}
              type="button"
              onClick={() => onSelectCampaign(camp.id)}
              className="bg-white hover:bg-[#FAFDFC] active:scale-[0.99] rounded-2xl p-4 sm:p-5 border border-[#E4E8EA] hover:border-[#0F9D8A]/50 text-left space-y-3 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#EAF6E1] text-[#2D6E1E] flex items-center justify-center shrink-0">
                    <CampaignIcon id={camp.id} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-[#172124] leading-snug">
                      {camp.title}
                    </div>
                    <div className="text-xs text-[#5B676D] mt-0.5">
                      {camp.organizer}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8A969C] shrink-0 mt-0.5" />
              </div>

              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-[#ECEFEF] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F9D8A] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#5B676D] font-num">
                  <span>{formatRupiah(camp.collected)} terkumpul</span>
                  <span className="font-semibold text-[#0B7A6B]">{pct}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CampaignDonateViewProps {
  campaign: SedekahCampaign;
  onDonate: (campaignId: string, amount: number) => void;
}

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export function CampaignDonateView({
  campaign,
  onDonate,
}: CampaignDonateViewProps) {
  const [amount, setAmount] = useState<number>(10000);
  const [customInput, setCustomInput] = useState<string>('');
  const pct = Math.min(
    100,
    Math.round((campaign.collected / campaign.goal) * 100)
  );

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const parsed = parseInt(val.replace(/\D/g, ''), 10);
    if (!Number.isNaN(parsed)) {
      setAmount(parsed);
    }
  };

  const validAmount = amount >= 1000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF6E1] text-[#2D6E1E] flex items-center justify-center">
          <CampaignIcon id={campaign.id} className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#172124]">{campaign.title}</h2>
          <p className="text-sm text-[#5B676D] mt-1">{campaign.organizer}</p>
        </div>

        <div className="space-y-2 pt-2">
          <div className="h-2.5 rounded-full bg-[#ECEFEF] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0F9D8A]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-[#5B676D] font-num">
            <span>
              Terkumpul <strong className="text-[#172124]">{formatRupiah(campaign.collected)}</strong>
            </span>
            <span>Target {formatRupiah(campaign.goal)}</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
        <div>
          <div className="text-xs font-medium text-[#5B676D] mb-2">
            Pilih nominal sedekah
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((preset) => {
              const active = amount === preset && customInput === '';
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomInput('');
                  }}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold font-num border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F9D8A] text-white border-[#0F9D8A]'
                      : 'bg-white text-[#172124] border-[#DCE2E4] hover:border-[#0F9D8A]'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="sedekah-custom"
            className="block text-xs font-medium text-[#5B676D] mb-1.5"
          >
            Atau nominal lain (minimal Rp1.000)
          </label>
          <input
            id="sedekah-custom"
            type="number"
            inputMode="numeric"
            min={1000}
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Masukkan jumlah dalam Rupiah"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-sm font-num text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
          />
        </div>

        <button
          type="button"
          disabled={!validAmount}
          onClick={() => onDonate(campaign.id, amount)}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer"
        >
          Sedekah {formatRupiah(amount)} · Bayar JK Pay
        </button>
      </div>
    </div>
  );
}
