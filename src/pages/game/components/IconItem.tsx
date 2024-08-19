import icons from '@/data/1.1/icons.webp';
import { useAppSelector } from '@/store/hooks';
import { getDataset } from '@/store/modules/settingsSlice';
import { Icon } from '@iconify/react';
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

  const icon = useMemo(
    () => dataset.iconEntities[name],
    [name, dataset.iconEntities]
  );

  const scale = useMemo(() => Number(size) / 64, [size]);

  return (
    <div
      className="text-4 relative font-bold leading-4 text-white"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        textShadow:
          '0px 2px 2px black, 0px -2px 2px black, 2px 0px 2px black, -2px 0px 2px black',
      }}
    >
      {icon ? (
        <div
          className="absolute left-0 top-0 h-16 w-16 origin-top-left"
          style={{
            background: `url(${icons})`,
            transform: `scale(${scale})`,
            backgroundPosition: icon.position,
          }}
        />
      ) : (
        <Icon icon={name} className="text-[32px] text-black" />
      )}
      {text && <div className="absolute right-0 top-0">{text}</div>}

      <div className="absolute bottom-0 w-full text-right">{children}</div>
    </div>
  );
};

export default IconItem;
