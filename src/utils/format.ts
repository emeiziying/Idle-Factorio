// 格式化大数字（用于库存显示）
export const formatNumber = (n: number): string => {
  // 先取整
  const rounded = Math.floor(n);
  
  if (rounded >= 1000000000) {
    return `${(rounded / 1000000000).toFixed(1)}B`;
  } else if (rounded >= 1000000) {
    return `${(rounded / 1000000).toFixed(1)}M`;
  } else if (rounded >= 1000) {
    return `${(rounded / 1000).toFixed(1)}K`;
  }
  return rounded.toString();
};

// 格式化精确数字
export const formatPrecise = (n: number): string => {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
};

// 格式化百分比
export const formatPercentage = (n: number): string => {
  return `${n.toFixed(1)}%`;
};

// 动态格式化时间
export const formatTime = (seconds: number): string => {
  if (seconds < 0) return '无限';
  
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs}秒`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}天${hours}小时`;
  }
};

// 格式化速率
export const formatRate = (rate: number, unit: 'second' | 'minute' | 'hour' = 'second'): string => {
  const formatted = formatNumber(rate);
  switch (unit) {
    case 'second':
      return `${formatted}/秒`;
    case 'minute':
      return `${formatted}/分钟`;
    case 'hour':
      return `${formatted}/小时`;
  }
};