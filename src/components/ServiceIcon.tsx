import {
  Bike,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  HeartHandshake,
  Headphones,
  BatteryCharging,
  Shirt,
  GlassWater,
  Backpack,
  LampDesk,
  Soup,
  Flame,
  Drumstick,
  Droplets,
  BookOpen,
  Sun,
} from 'lucide-react';
import type { ServiceId } from '../data/jalanKitaData';

export function ServiceIcon({
  id,
  className = 'w-6 h-6',
}: {
  id: ServiceId;
  className?: string;
}) {
  switch (id) {
    case 'bike':
      return <Bike className={className} strokeWidth={2} />;
    case 'car':
      return <Car className={className} strokeWidth={2} />;
    case 'food':
      return <UtensilsCrossed className={className} strokeWidth={2} />;
    case 'shop':
      return <ShoppingBag className={className} strokeWidth={2} />;
    case 'pickup':
      return <Package className={className} strokeWidth={2} />;
    case 'sedekah':
      return <HeartHandshake className={className} strokeWidth={2} />;
  }
}

export function ShopItemIcon({
  id,
  className = 'w-7 h-7',
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case 's1':
      return <Headphones className={className} strokeWidth={1.8} />;
    case 's2':
      return <BatteryCharging className={className} strokeWidth={1.8} />;
    case 's3':
      return <Shirt className={className} strokeWidth={1.8} />;
    case 's4':
      return <GlassWater className={className} strokeWidth={1.8} />;
    case 's5':
      return <Backpack className={className} strokeWidth={1.8} />;
    case 's6':
      return <LampDesk className={className} strokeWidth={1.8} />;
    default:
      return <ShoppingBag className={className} strokeWidth={1.8} />;
  }
}

export function RestaurantIcon({
  id,
  className = 'w-6 h-6',
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case 'f1':
      return <Soup className={className} strokeWidth={1.9} />;
    case 'f2':
      return <Flame className={className} strokeWidth={1.9} />;
    case 'f3':
      return <Drumstick className={className} strokeWidth={1.9} />;
    default:
      return <UtensilsCrossed className={className} strokeWidth={1.9} />;
  }
}

export function CampaignIcon({
  id,
  className = 'w-6 h-6',
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case 'c1':
      return <Soup className={className} strokeWidth={1.9} />;
    case 'c2':
      return <BookOpen className={className} strokeWidth={1.9} />;
    case 'c3':
      return <Droplets className={className} strokeWidth={1.9} />;
    case 'c4':
      return <Sun className={className} strokeWidth={1.9} />;
    default:
      return <HeartHandshake className={className} strokeWidth={1.9} />;
  }
}
