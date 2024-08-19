import { useMemo } from 'react';

interface PieProgressProps {
  value: number;
}

const PieProgress = ({ value }: PieProgressProps) => {
  const style = useMemo(() => {
    const angle = Math.floor((value / 100) * 360);
    return {
      backgroundImage: `conic-gradient(#ffae4c80 0,#ffae4c80 ${angle}deg,transparent ${angle}deg,transparent 100%)`,
    };
  }, [value]);

  return (
    <div className="relative h-full w-full bg-black/30">
      <div className="h-full w-full" style={style} />
    </div>
  );
};

export default PieProgress;
