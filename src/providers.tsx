import { Rational } from '@/models';
import storage from '@/store/storage';
import { makeStore, type AppStore } from '@/store/store';
import { useRef } from 'react';
import { Provider as StoreProvider } from 'react-redux';

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    const savedData = storage.load();

    savedData?.records &&
      Object.keys(savedData.records).forEach((key) => {
        const v = savedData.records[key].stock as never as string;
        savedData.records[key].stock = new Rational(BigInt(v) || 0n);
      });
    savedData?.crafting &&
      savedData.crafting.manualQueue.forEach((item) => {
        item.amount = new Rational(
          BigInt(item.amount as never as string) || 0n
        );
      });

    storeRef.current = makeStore(savedData);
  }

  return <StoreProvider store={storeRef.current}>{children}</StoreProvider>;
}
