'use client';
import { useAppSelector } from '@/store/hooks';
import { craftingsState } from '@/store/modules/craftingsSlice';
import { electricsState } from '@/store/modules/electricsSlice';
import { gameState } from '@/store/modules/gameSlice';
import { recordsState } from '@/store/modules/recordsSlice';
import { settingsState } from '@/store/modules/settingsSlice';
import storage from '@/store/storage';
import { useRafInterval } from 'ahooks';
import { useState } from 'react';

const AutoSave = () => {
  const [saving, setSaving] = useState(false);
  const [seconds, setSeconds] = useState(10);

  const records = useAppSelector(recordsState);
  const craftings = useAppSelector(craftingsState);
  const game = useAppSelector(gameState);
  const settings = useAppSelector(settingsState);
  const electrics = useAppSelector(electricsState);

  useRafInterval(() => {
    const s = seconds - 1;
    if (s <= 0) {
      setSaving(true);
      storage.save({ records, craftings, game, settings, electrics });

      setTimeout(() => {
        setSaving(false);
        setSeconds(10);
      }, 1000);
    } else {
      setSeconds(s);
    }
  }, 1000);

  return (
    <div className="px-5">
      {saving ? '自动保存中...' : `${seconds}秒后自动保存`}
    </div>
  );
};

export default AutoSave;
