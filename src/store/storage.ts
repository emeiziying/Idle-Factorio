import { Rational } from '@/models';
import type { RootState } from '@/store/store';
import packageInfo from '@@/package.json';

const key = `saved_v${packageInfo.version}`;

const storage = {
  save: (data: Partial<RootState>) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  },
  load: (defaultData?: Partial<RootState>): RootState | undefined => {
    if (typeof localStorage !== 'undefined') {
      const data = JSON.parse(
        localStorage.getItem(key) ?? 'null',
        (_, value: unknown) =>
          String(value).indexOf('#r-') >= 0
            ? new Rational(
                BigInt(String(value).split('#r-')[1] as never as string) || 0n
              )
            : value
      ) as RootState;
      if (!data) return undefined;
      return Object.assign({}, data, defaultData);
    }
    return undefined;
  },
};

export default storage;
