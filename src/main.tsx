import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { lazy, Suspense } from 'react';
import App from './App.tsx';
import './index.css';

registerSW({ immediate: true });

// Tier 1 Google Maps Platform quota & auth error listeners
(window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

const DriverApp = lazy(() => import('./apps/DriverApp'));
const UmkmApp = lazy(() => import('./apps/UmkmApp'));

// Pemisahan aplikasi berdasarkan URL: / (Customer), /driver, /umkm.
const path = window.location.pathname.replace(/\/+$/, '');
const appKind = path.startsWith('/driver')
  ? 'driver'
  : path.startsWith('/umkm')
    ? 'umkm'
    : 'customer';

// Tiap aplikasi memakai manifest PWA sendiri agar bisa dipasang terpisah.
if (appKind !== 'customer') {
  const manifestHref = `/manifest-${appKind}.webmanifest`;
  const setManifest = () => {
    document
      .querySelectorAll('link[rel="manifest"]')
      .forEach((el) => el.setAttribute('href', manifestHref));
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestHref;
      document.head.appendChild(link);
    }
  };
  setManifest();
  new MutationObserver(setManifest).observe(document.head, { childList: true });
  document.title = appKind === 'driver' ? 'GoDrive Driver' : 'GoDrive UMKM';
}

const root = createRoot(document.getElementById('root')!);
if (appKind === 'driver') {
  root.render(
    <Suspense fallback={null}>
      <DriverApp />
    </Suspense>
  );
} else if (appKind === 'umkm') {
  root.render(
    <Suspense fallback={null}>
      <UmkmApp />
    </Suspense>
  );
} else {
  root.render(<App />);
}
