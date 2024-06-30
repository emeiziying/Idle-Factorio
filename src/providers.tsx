import storage from '@/store/storage';
import { makeStore, type AppStore } from '@/store/store';
import { useRef } from 'react';
import { Provider as StoreProvider } from 'react-redux';

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    const savedData = storage.load();
    storeRef.current = makeStore(savedData);
  }

  return <StoreProvider store={storeRef.current}>{children}</StoreProvider>;
}
