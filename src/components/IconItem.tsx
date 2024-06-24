import icons from '@/data/1.1/icons.webp';
import { useAppSelector } from '@/store/hooks';
import { getDataset } from '@/store/modules/settingsSlice';
import { useMemo, type ReactNode } from 'react';

interface Props {
  name: string;
  text?: string;
  size?: number | string;
  children?: ReactNode;
}

const IconItem = (props: Props) => {
  const { name, text, size = 32, children } = props;

  const dataset = useAppSelector(getDataset);

  const style = useMemo(() => {
    const icon = dataset.iconEntities[name];
    if (!icon) return;
    return { backgroundPosition: icon.position };
  }, [name, dataset.iconEntities]);

  const scale = useMemo(() => Number(size) / 64, [size]);

  return (
    <div
      className="relative text-white font-bold leading-4	text-4"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        textShadow:
          '0px 2px 2px black, 0px -2px 2px black, 2px 0px 2px black, -2px 0px 2px black',
      }}
    >
      <div
        className="absolute left-0 top-0 w-16 h-16 origin-top-left "
        style={{
          background: `url(${icons})`,
          transform: `scale(${scale})`,
          ...style,
        }}
      />
      {text && <div className="absolute right-0 top-0">{text}</div>}

      <div className="absolute w-full text-right bottom-0">{children}</div>
    </div>
  );
};

export default IconItem;
