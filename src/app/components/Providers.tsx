'use client';

import { Provider } from 'react-redux';
import { store } from '../redux/store';
import dynamic from 'next/dynamic';

// Wrapper component for Redux Provider
function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

// Use dynamic import with no SSR to prevent hydration mismatches
const ClientOnlyReduxProvider = dynamic(() => Promise.resolve(ReduxProvider), {
  ssr: false,
  loading: () => <div suppressHydrationWarning>{/* Loading placeholder */}</div>
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientOnlyReduxProvider>{children}</ClientOnlyReduxProvider>;
} 