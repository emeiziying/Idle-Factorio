interface LinearProgressProps {
  value?: number;
}

const LinearProgress = ({ value }: LinearProgressProps) => {
  return (
    <div className="h-1 w-full bg-[#a7caed]">
      <div className="h-full bg-[#1976d2]" style={{ width: `${value}%` }}></div>
    </div>
  );
};

export default LinearProgress;
