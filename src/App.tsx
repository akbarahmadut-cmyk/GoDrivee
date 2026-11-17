import { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ArrowLeft, Home, ReceiptText, Wallet } from 'lucide-react';
import {
  DRIVER_OFFSET_KM,
  DRIVER_ROSTER,
  INITIAL_CAMPAIGNS,
  PRESET_PLACES,
  RESTAURANTS,
  SERVICE_CENTER_ID,
  SERVICE_RADIUS_KM,
  SERVICE_STEPS,
  SERVICES,
  SHOP_ITEMS,
  buildDriverChatReply,
  buildInitialDriverGreeting,
  formatRupiah,
  formatTimeNow,
  type ChatMessage,
  type OrderRecord,
  type RootTab,
  type SedekahCampaign,
  type SelectedLocation,
  type ServiceId,
  type ViewRoute,
  type WalletTransaction,
} from './data/jalanKitaData';
import { usePresetPlacesResolver } from './hooks/usePlacesResolver';
import { HomeView } from './components/HomeView';
import { RideView } from './components/RideView';
import { FoodListView, RestaurantMenuView } from './components/FoodView';
import { ShopView } from './components/ShopView';
import { CheckoutView } from './components/CheckoutView';
import { PickupView, type PickupDraft } from './components/PickupView';
import { SedekahListView, CampaignDonateView } from './components/SedekahView';
import { TrackOrderView } from './components/TrackOrderView';
import { ActivityView } from './components/ActivityView';
import { WalletView } from './components/WalletView';
import { OfflineIndicator } from './components/PWAControls';
import { MapsAvailabilityContext } from './components/GoogleRouteMap';
import { useOrderNotifications } from './hooks/useOrderNotifications';

const RAW_MAPS_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
const GOOGLE_MAPS_API_KEY =
  RAW_MAPS_KEY && RAW_MAPS_KEY !== 'MY_GOOGLE_MAPS_API_KEY' ? RAW_MAPS_KEY : '';

interface LocationChoice {
  presetId: string;
  custom?: SelectedLocation;
}

function JalanKitaShell({
  quotaExceeded,
  mapsMissing,
  onForceRefresh,
}: {
  quotaExceeded: boolean;
  mapsMissing: boolean;
  onForceRefresh: () => void;
}) {
  const [mapsNoticeDismissed, setMapsNoticeDismissed] = useState(false);
  const {
    placesReady,
    resolvePresetById,
    getPresetLocation,
    serviceCenterCoords,
  } = usePresetPlacesResolver();

  const [wallet, setWallet] = useState<number>(250000);
  const [giving, setGiving] = useState<number>(0);
  const [firstDeliveryPromoAvailable, setFirstDeliveryPromoAvailable] =
    useState<boolean>(true);
  const [campaigns, setCampaigns] =
    useState<SedekahCampaign[]>(INITIAL_CAMPAIGNS);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [walletTx, setWalletTx] = useState<WalletTransaction[]>([]);

  const [tab, setTab] = useState<RootTab>('home');
  const [stack, setStack] = useState<ViewRoute[]>([]);

  const [rideChoices, setRideChoices] = useState<{
    bike: { from: LocationChoice; to: LocationChoice };
    car: { from: LocationChoice; to: LocationChoice };
  }>({
    bike: {
      from: { presetId: PRESET_PLACES[0].id },
      to: { presetId: PRESET_PLACES[3].id },
    },
    car: {
      from: { presetId: PRESET_PLACES[0].id },
      to: { presetId: PRESET_PLACES[3].id },
    },
  });

  const [foodCart, setFoodCart] = useState<{
    restaurantId: string;
    items: Record<number, number>;
  }>({
    restaurantId: RESTAURANTS[0].id,
    items: {},
  });

  const [shopCart, setShopCart] = useState<Record<number, number>>({});
  const [deliveryChoice, setDeliveryChoice] = useState<LocationChoice>({
    presetId: PRESET_PLACES[0].id,
  });

  const [pickupDraft, setPickupDraft] = useState<PickupDraft>({
    fromId: PRESET_PLACES[1].id,
    toId: PRESET_PLACES[2].id,
    item: 'Dokumen',
    weight: '<1 kg',
    note: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const chatReplyTimersRef = useRef<number[]>([]);
  const nextOrderIdRef = useRef<number>(1);
  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    enabled: notificationsEnabled,
    requestAndEnable: requestOrderNotifications,
    toggleEnabled: toggleOrderNotifications,
    notifyOrderStage,
  } = useOrderNotifications();
  const prevOrderStepsRef = useRef<Record<number, number>>({});

  useEffect(() => {
    return () => {
      chatReplyTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId)
      );
      chatReplyTimersRef.current = [];
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  const resolveChoice = useCallback(
    (choice: LocationChoice): SelectedLocation => {
      if (choice.custom) return choice.custom;
      return getPresetLocation(choice.presetId);
    },
    [getPresetLocation]
  );

  // Automatically resolve coordinates for currently visible/active preset locations
  useEffect(() => {
    if (!placesReady) return;
    const idsToResolve = new Set<string>([
      SERVICE_CENTER_ID,
      rideChoices.bike.from.presetId,
      rideChoices.bike.to.presetId,
      rideChoices.car.from.presetId,
      rideChoices.car.to.presetId,
      pickupDraft.fromId,
      pickupDraft.toId,
      deliveryChoice.presetId,
      PRESET_PLACES[1].id,
    ]);
    idsToResolve.forEach((id) => {
      if (!id.startsWith('custom-') && !id.startsWith('gps-')) {
        void resolvePresetById(id);
      }
    });
  }, [
    placesReady,
    rideChoices,
    pickupDraft.fromId,
    pickupDraft.toId,
    deliveryChoice.presetId,
    resolvePresetById,
  ]);

  // Advance active orders smoothly every 2.6 seconds
  const hasRunningOrder = orders.some((o) => o.step < o.steps.length);
  useEffect(() => {
    if (!hasRunningOrder) return;
    const interval = window.setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.step < order.steps.length) {
            const nextStep = order.step + 1;
            const shouldSeedGreeting =
              nextStep === 1 &&
              order.svc !== 'sedekah' &&
              (!order.messages || order.messages.length === 0);
            if (shouldSeedGreeting) {
              const greeting: ChatMessage = {
                id: `msg-init-${order.id}`,
                sender: 'driver',
                text: buildInitialDriverGreeting(order),
                time: formatTimeNow(),
              };
              return {
                ...order,
                step: nextStep,
                messages: [greeting],
              };
            }
            return { ...order, step: nextStep };
          }
          return order;
        })
      );
    }, 2600);
    return () => window.clearInterval(interval);
  }, [hasRunningOrder]);

  // Trigger browser notification whenever an order advances to a new stage
  useEffect(() => {
    const prevSteps = prevOrderStepsRef.current;
    orders.forEach((order) => {
      const previousStep = prevSteps[order.id];
      if (previousStep !== undefined && order.step > previousStep) {
        const svcName =
          SERVICES.find((s) => s.id === order.svc)?.name ?? 'GoDrive';
        const isCompleted = order.step >= order.steps.length;
        if (isCompleted) {
          notifyOrderStage(
            `${svcName} · Pesanan Selesai`,
            `${order.label} telah selesai.`,
            `godrive-order-${order.id}`
          );
        } else {
          const stageLabel = order.steps[order.step] ?? 'Pembaruan status';
          const body =
            order.step === 1 && order.svc !== 'sedekah'
              ? `${order.drv[0]} (${order.drv[1]}) · ${order.label}`
              : order.label;
          notifyOrderStage(
            `${svcName} · ${stageLabel}`,
            body,
            `godrive-order-${order.id}`
          );
        }
      }
      prevSteps[order.id] = order.step;
    });
  }, [orders, notifyOrderStage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab, stack]);

  const currentRoute: ViewRoute =
    stack.length > 0 ? stack[stack.length - 1] : { view: 'root' };

  const pushRoute = (route: ViewRoute) => {
    setStack((prev) => [...prev, route]);
  };

  const popRoute = () => {
    setStack((prev) => prev.slice(0, -1));
  };

  const switchRootTab = (nextTab: RootTab) => {
    setTab(nextTab);
    setStack([]);
  };

  const handleSelectService = (id: ServiceId) => {
    switch (id) {
      case 'bike':
        pushRoute({ view: 'ride', service: 'bike' });
        break;
      case 'car':
        pushRoute({ view: 'ride', service: 'car' });
        break;
      case 'food':
        pushRoute({ view: 'food' });
        break;
      case 'shop':
        pushRoute({ view: 'shop' });
        break;
      case 'pickup':
        pushRoute({ view: 'pickup' });
        break;
      case 'sedekah':
        pushRoute({ view: 'sedekah' });
        break;
    }
  };

  const createPaidOrder = (
    amount: number,
    label: string,
    svc: ServiceId,
    options?: {
      origin?: SelectedLocation;
      destination?: SelectedLocation;
      distanceKm?: number;
      durationMinutes?: number;
      extra?: OrderRecord['extra'];
      initialStep?: number;
    }
  ): OrderRecord | null => {
    if (wallet < amount) {
      showToast('Saldo JK Pay kurang. Isi saldo dulu di tab Dompet.');
      return null;
    }
    const time = formatTimeNow();
    const order: OrderRecord = {
      id: nextOrderIdRef.current++,
      svc,
      label,
      amt: amount,
      step: options?.initialStep ?? 0,
      steps: SERVICE_STEPS[svc],
      time,
      drv: DRIVER_ROSTER[Math.floor(Math.random() * DRIVER_ROSTER.length)],
      origin: options?.origin,
      destination: options?.destination,
      distanceKm: options?.distanceKm,
      durationMinutes: options?.durationMinutes,
      extra: options?.extra,
    };

    setWallet((prev) => prev - amount);
    setOrders((prev) => [order, ...prev]);
    setWalletTx((prev) => [
      {
        id: `tx-${Date.now()}-${order.id}`,
        label,
        amount,
        kind: 'debit',
        time,
      },
      ...prev,
    ]);

    return order;
  };

  const handleOrderRide = (
    service: 'bike' | 'car',
    fare: number,
    distanceKm: number,
    durationMinutes: number
  ) => {
    const origin = resolveChoice(rideChoices[service].from);
    const destination = resolveChoice(rideChoices[service].to);
    const nearbyCount = DRIVER_OFFSET_KM.length;
    const svcName = SERVICES.find((s) => s.id === service)!.name;
    const order = createPaidOrder(
      fare,
      `${svcName}: ${origin.label} → ${destination.label}`,
      service,
      {
        origin,
        destination,
        distanceKm,
        durationMinutes,
        extra: { nearbyCount },
      }
    );
    if (!order) return;
    pushRoute({ view: 'track', orderId: order.id });
  };

  const handleOrderPickup = (
    fare: number,
    distanceKm: number,
    durationMinutes: number
  ) => {
    const origin =
      pickupDraft.customFrom ?? getPresetLocation(pickupDraft.fromId);
    const destination =
      pickupDraft.customTo ?? getPresetLocation(pickupDraft.toId);
    const nearbyCount = DRIVER_OFFSET_KM.length;
    const order = createPaidOrder(
      fare,
      `Pick up ${pickupDraft.item}: ${origin.label} → ${destination.label}`,
      'pickup',
      {
        origin,
        destination,
        distanceKm,
        durationMinutes,
        extra: {
          nearbyCount,
          note: pickupDraft.note.trim() || undefined,
        },
      }
    );
    if (!order) return;
    pushRoute({ view: 'track', orderId: order.id });
  };

  const handlePlaceCartOrder = (
    kind: 'food' | 'shop',
    total: number,
    usedPromo: boolean
  ) => {
    const resto = RESTAURANTS.find((r) => r.id === foodCart.restaurantId);
    const originPresetId =
      kind === 'food' && resto?.id === 'f3'
        ? PRESET_PLACES[1].id
        : PRESET_PLACES[0].id;
    const baseOrigin = getPresetLocation(originPresetId);
    const origin: SelectedLocation = {
      ...baseOrigin,
      label: kind === 'food' ? (resto?.name ?? baseOrigin.label) : 'Mitra Go Shop Palattae',
    };
    const destination = resolveChoice(deliveryChoice);

    const label =
      kind === 'food'
        ? `Go Food: ${resto?.name ?? 'Kuliner'}`
        : 'Belanja Go Shop';
    const order = createPaidOrder(total, label, kind, {
      origin,
      destination,
      extra: { nearbyCount: DRIVER_OFFSET_KM.length },
    });
    if (!order) return;

    if (usedPromo) {
      setFirstDeliveryPromoAvailable(false);
    }
    if (kind === 'food') {
      setFoodCart((prev) => ({ ...prev, items: {} }));
    } else {
      setShopCart({});
    }
    setStack([{ view: 'track', orderId: order.id }]);
  };

  const handleDonate = (campaignId: string, amount: number) => {
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return;
    const order = createPaidOrder(amount, `Sedekah: ${camp.title}`, 'sedekah', {
      initialStep: 1,
    });
    if (!order) return;

    setGiving((prev) => prev + amount);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, collected: c.collected + amount } : c
      )
    );
    setStack([{ view: 'sedekah' }]);
    showToast('Terima kasih, sedekahmu telah disalurkan.');
  };

  const handleTopUp = (amount: number) => {
    setWallet((prev) => prev + amount);
    setWalletTx((prev) => [
      {
        id: `topup-${Date.now()}`,
        label: 'Isi Saldo JK Pay',
        amount,
        kind: 'topup',
        time: formatTimeNow(),
      },
      ...prev,
    ]);
    showToast(`Saldo bertambah ${formatRupiah(amount)}`);
  };

  const handleRateDriver = (orderId: number, stars: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rate: stars } : o))
    );
  };

  const handleSendOrderMessage = useCallback(
    (orderId: number, rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `msg-u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'user',
        text: trimmed,
        time: formatTimeNow(),
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, messages: [...(o.messages ?? []), userMsg] }
            : o
        )
      );

      const timerId = window.setTimeout(() => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const replyMsg: ChatMessage = {
              id: `msg-d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              sender: 'driver',
              text: buildDriverChatReply(o, trimmed),
              time: formatTimeNow(),
            };
            return { ...o, messages: [...(o.messages ?? []), replyMsg] };
          })
        );
      }, 900);

      chatReplyTimersRef.current.push(timerId);
    },
    []
  );

  const getSubViewTitle = (route: ViewRoute): string => {
    switch (route.view) {
      case 'ride':
        return route.service === 'bike' ? 'Go Bike' : 'Go Car';
      case 'food':
        return 'Go Food';
      case 'menu':
        return (
          RESTAURANTS.find((r) => r.id === route.restaurantId)?.name ?? 'Menu'
        );
      case 'shop':
        return 'Go Shop';
      case 'checkout':
        return 'Checkout';
      case 'pickup':
        return 'Go Pick up';
      case 'sedekah':
        return 'Go Sedekah';
      case 'campaign':
        return 'Donasi';
      case 'track':
        return 'Lacak Pesanan & Driver';
      case 'root':
        return 'GoDrive';
    }
  };

  const renderMainContent = () => {
    if (currentRoute.view === 'root') {
      if (tab === 'home') {
        return (
          <HomeView
            wallet={wallet}
            giving={giving}
            firstDeliveryPromoAvailable={firstDeliveryPromoAvailable}
            activeOrders={orders.filter((o) => o.step < o.steps.length)}
            onSelectService={handleSelectService}
            onSwitchTab={switchRootTab}
            onTrackOrder={(orderId) => pushRoute({ view: 'track', orderId })}
          />
        );
      }
      if (tab === 'act') {
        return (
          <ActivityView
            orders={orders}
            onOpenOrder={(orderId) => pushRoute({ view: 'track', orderId })}
            onGoHome={() => switchRootTab('home')}
          />
        );
      }
      return (
        <WalletView
          balance={wallet}
          transactions={walletTx}
          onTopUp={handleTopUp}
        />
      );
    }

    switch (currentRoute.view) {
      case 'ride': {
        const svc = currentRoute.service;
        const fromLoc = resolveChoice(rideChoices[svc].from);
        const toLoc = resolveChoice(rideChoices[svc].to);
        return (
          <RideView
            service={svc}
            from={fromLoc}
            to={toLoc}
            serviceCenterCoords={serviceCenterCoords}
            onSelectFromPreset={(presetId) => {
              void resolvePresetById(presetId);
              setRideChoices((prev) => ({
                ...prev,
                [svc]: { ...prev[svc], from: { presetId } },
              }));
            }}
            onSelectToPreset={(presetId) => {
              void resolvePresetById(presetId);
              setRideChoices((prev) => ({
                ...prev,
                [svc]: { ...prev[svc], to: { presetId } },
              }));
            }}
            onSelectFromCustom={(custom) =>
              setRideChoices((prev) => ({
                ...prev,
                [svc]: {
                  ...prev[svc],
                  from: { presetId: custom.id, custom },
                },
              }))
            }
            onSelectToCustom={(custom) =>
              setRideChoices((prev) => ({
                ...prev,
                [svc]: {
                  ...prev[svc],
                  to: { presetId: custom.id, custom },
                },
              }))
            }
            onSwapPlaces={() =>
              setRideChoices((prev) => ({
                ...prev,
                [svc]: { from: prev[svc].to, to: prev[svc].from },
              }))
            }
            onOrderRide={(fare, distanceKm, durationMin) =>
              handleOrderRide(svc, fare, distanceKm, durationMin)
            }
            onShowToast={showToast}
          />
        );
      }
      case 'food':
        return (
          <FoodListView
            onSelectRestaurant={(restaurantId) => {
              if (foodCart.restaurantId !== restaurantId) {
                setFoodCart({ restaurantId, items: {} });
              }
              pushRoute({ view: 'menu', restaurantId });
            }}
          />
        );
      case 'menu': {
        const resto =
          RESTAURANTS.find((r) => r.id === currentRoute.restaurantId) ??
          RESTAURANTS[0];
        const quantities =
          foodCart.restaurantId === resto.id ? foodCart.items : {};
        return (
          <RestaurantMenuView
            restaurant={resto}
            quantities={quantities}
            onChangeQty={(itemIdx, delta) => {
              setFoodCart((prev) => {
                const base =
                  prev.restaurantId === resto.id ? prev.items : {};
                const nextQty = Math.max(0, (base[itemIdx] ?? 0) + delta);
                return {
                  restaurantId: resto.id,
                  items: { ...base, [itemIdx]: nextQty },
                };
              });
            }}
            onGoToCheckout={() => pushRoute({ view: 'checkout', kind: 'food' })}
          />
        );
      }
      case 'shop':
        return (
          <ShopView
            quantities={shopCart}
            onChangeQty={(itemIdx, delta) => {
              setShopCart((prev) => ({
                ...prev,
                [itemIdx]: Math.max(0, (prev[itemIdx] ?? 0) + delta),
              }));
            }}
            onGoToCheckout={() => pushRoute({ view: 'checkout', kind: 'shop' })}
          />
        );
      case 'checkout': {
        const kind = currentRoute.kind;
        const deliveryLoc = resolveChoice(deliveryChoice);
        if (kind === 'food') {
          const resto =
            RESTAURANTS.find((r) => r.id === foodCart.restaurantId) ??
            RESTAURANTS[0];
          const lineItems = resto.items
            .map((item, idx) => ({
              name: item.name,
              price: item.price,
              qty: foodCart.items[idx] ?? 0,
            }))
            .filter((x) => x.qty > 0);
          return (
            <CheckoutView
              kind="food"
              title={resto.name}
              items={lineItems}
              address={deliveryLoc}
              serviceCenterCoords={serviceCenterCoords}
              firstDeliveryPromoAvailable={firstDeliveryPromoAvailable}
              onSelectPresetAddress={(presetId) => {
                void resolvePresetById(presetId);
                setDeliveryChoice({ presetId });
              }}
              onSelectCustomAddress={(custom) =>
                setDeliveryChoice({ presetId: custom.id, custom })
              }
              onPlaceOrder={(total, usedPromo) =>
                handlePlaceCartOrder('food', total, usedPromo)
              }
              onShowToast={showToast}
            />
          );
        }
        const shopLineItems = SHOP_ITEMS.map((item, idx) => ({
          name: item.name,
          price: item.price,
          qty: shopCart[idx] ?? 0,
        })).filter((x) => x.qty > 0);
        return (
          <CheckoutView
            kind="shop"
            title="Go Shop"
            items={shopLineItems}
            address={deliveryLoc}
            serviceCenterCoords={serviceCenterCoords}
            firstDeliveryPromoAvailable={firstDeliveryPromoAvailable}
            onSelectPresetAddress={(presetId) => {
              void resolvePresetById(presetId);
              setDeliveryChoice({ presetId });
            }}
            onSelectCustomAddress={(custom) =>
              setDeliveryChoice({ presetId: custom.id, custom })
            }
            onPlaceOrder={(total, usedPromo) =>
              handlePlaceCartOrder('shop', total, usedPromo)
            }
            onShowToast={showToast}
          />
        );
      }
      case 'pickup': {
        const fromLoc =
          pickupDraft.customFrom ?? getPresetLocation(pickupDraft.fromId);
        const toLoc =
          pickupDraft.customTo ?? getPresetLocation(pickupDraft.toId);
        return (
          <PickupView
            draft={pickupDraft}
            fromLocation={fromLoc}
            toLocation={toLoc}
            serviceCenterCoords={serviceCenterCoords}
            onChangeDraft={(next) => {
              if (!next.customFrom) void resolvePresetById(next.fromId);
              if (!next.customTo) void resolvePresetById(next.toId);
              setPickupDraft(next);
            }}
            onOrderPickup={handleOrderPickup}
            onShowToast={showToast}
          />
        );
      }
      case 'sedekah':
        return (
          <SedekahListView
            giving={giving}
            campaigns={campaigns}
            onSelectCampaign={(campaignId) =>
              pushRoute({ view: 'campaign', campaignId })
            }
          />
        );
      case 'campaign': {
        const camp =
          campaigns.find((c) => c.id === currentRoute.campaignId) ??
          campaigns[0];
        return <CampaignDonateView campaign={camp} onDonate={handleDonate} />;
      }
      case 'track': {
        const order = orders.find((o) => o.id === currentRoute.orderId);
        if (!order) {
          return (
            <div className="bg-white rounded-2xl p-6 border border-[#E4E8EA] text-center space-y-3">
              <p className="text-sm text-[#5B676D]">Pesanan tidak ditemukan.</p>
              <button
                type="button"
                onClick={() => switchRootTab('home')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F9D8A] text-white text-sm font-semibold cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          );
        }
        return (
          <TrackOrderView
            order={order}
            notifications={{
              isSupported: notificationsSupported,
              permission: notificationPermission,
              enabled: notificationsEnabled,
              onEnable: async () => {
                const res = await requestOrderNotifications();
                if (res === 'granted') {
                  showToast('Notifikasi status pesanan diaktifkan.');
                } else if (res === 'denied') {
                  showToast(
                    'Izin notifikasi diblokir browser. Aktifkan di pengaturan situs.'
                  );
                }
              },
              onToggle: () => {
                const next = !notificationsEnabled;
                toggleOrderNotifications();
                showToast(
                  next
                    ? 'Notifikasi status pesanan diaktifkan.'
                    : 'Notifikasi status pesanan dijeda.'
                );
              },
            }}
            onRateDriver={handleRateDriver}
            onSendMessage={handleSendOrderMessage}
            onBackHome={() => switchRootTab('home')}
          />
        );
      }
    }
  };

  const isSubView = currentRoute.view !== 'root';

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#F5F7F7] text-[#172124]">
      {/* Demo Key Quota Exhausted Notice (Section 8 Case A) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Non-blocking Maps key notice with hard-reload / SW cache refresh */}
      {mapsMissing && !mapsNoticeDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 text-xs md:text-sm flex flex-wrap items-center justify-center gap-2.5">
          <span>
            Kunci Google Maps belum terbaca di sesi ini. Layanan Go Food, Go Shop, Go Sedekah, dan Dompet tetap dapat digunakan.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onForceRefresh}
              className="px-3 py-1 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-800 transition-colors cursor-pointer"
            >
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={() => setMapsNoticeDismissed(true)}
              className="px-2 py-1 rounded-lg text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Desktop 3-Zone Top Bar */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E8EA]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => switchRootTab('home')}
            className="text-lg font-bold tracking-tight text-[#0B7A6B] whitespace-nowrap shrink-0 cursor-pointer"
          >
            GoDrive
          </button>

          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => switchRootTab('home')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === 'home' && !isSubView
                  ? 'text-[#0B7A6B] font-semibold border-b-2 border-[#0F9D8A]'
                  : 'text-[#5B676D] hover:text-[#172124]'
              }`}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => switchRootTab('act')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === 'act' && !isSubView
                  ? 'text-[#0B7A6B] font-semibold border-b-2 border-[#0F9D8A]'
                  : 'text-[#5B676D] hover:text-[#172124]'
              }`}
            >
              Aktivitas
            </button>
            <button
              type="button"
              onClick={() => switchRootTab('acc')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === 'acc' && !isSubView
                  ? 'text-[#0B7A6B] font-semibold border-b-2 border-[#0F9D8A]'
                  : 'text-[#5B676D] hover:text-[#172124]'
              }`}
            >
              Dompet
            </button>
            <button
              type="button"
              onClick={() => setStack([{ view: 'sedekah' }])}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                currentRoute.view === 'sedekah' ||
                currentRoute.view === 'campaign'
                  ? 'text-[#0B7A6B] font-semibold border-b-2 border-[#0F9D8A]'
                  : 'text-[#5B676D] hover:text-[#172124]'
              }`}
            >
              Go Sedekah
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => switchRootTab('acc')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] text-white text-xs font-semibold font-num transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Isi Saldo · {formatRupiah(wallet)}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Sub-View Sticky Top Bar */}
      {isSubView && (
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E8EA] h-[52px] px-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Kembali"
            onClick={popRoute}
            className="w-11 h-11 rounded-full bg-[#E3F5F2] text-[#0B7A6B] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-[#172124] truncate">
            {getSubViewTitle(currentRoute)}
          </span>
        </header>
      )}

      {/* Desktop Sub-View Breadcrumb Bar */}
      {isSubView && (
        <div className="hidden md:block max-w-5xl w-full mx-auto px-6 pt-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={popRoute}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#E4E8EA] hover:bg-[#FAFDFC] text-sm font-semibold text-[#0B7A6B] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <h1 className="text-xl font-bold text-[#172124]">
              {getSubViewTitle(currentRoute)}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-24 md:pb-12">
        {renderMainContent()}
      </main>

      {/* Mobile Fixed Bottom Thumb Navigation */}
      <nav
        aria-label="Navigasi bawah"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E8EA] grid grid-cols-3 h-16 pb-safe"
      >
        {(
          [
            ['home', 'Beranda', Home],
            ['act', 'Aktivitas', ReceiptText],
            ['acc', 'Dompet', Wallet],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = tab === key && !isSubView;
          return (
            <button
              key={key}
              type="button"
              onClick={() => switchRootTab(key)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                active ? 'text-[#0B7A6B]' : 'text-[#6B7780]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
              <span
                className={`text-[11px] leading-none ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-50 max-w-[90vw] px-4 py-2.5 rounded-xl bg-[#172124] text-white text-sm font-medium shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const handleForceRefresh = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Ignore cache clear failures and reload anyway
    }
    window.location.reload();
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <MapsAvailabilityContext.Provider value={false}>
        <JalanKitaShell
          quotaExceeded={quotaExceeded}
          mapsMissing={true}
          onForceRefresh={() => void handleForceRefresh()}
        />
      </MapsAvailabilityContext.Provider>
    );
  }

  return (
    <MapsAvailabilityContext.Provider value={true}>
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        language="id"
        region="ID"
        libraries={['places', 'routes', 'marker']}
      >
        <JalanKitaShell
          quotaExceeded={quotaExceeded}
          mapsMissing={false}
          onForceRefresh={() => void handleForceRefresh()}
        />
      </APIProvider>
    </MapsAvailabilityContext.Provider>
  );
}
