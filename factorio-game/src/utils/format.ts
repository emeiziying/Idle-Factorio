// 格式化数字，添加千位分隔符
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

// 格式化时间（秒）为可读格式
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`;
  }
};

// 格式化生产率（每分钟）
export const formatRate = (rate: number): string => {
  if (rate === 0) return '0/分';
  if (rate < 0.01) return '<0.01/分';
  if (rate < 1) return `${rate.toFixed(2)}/分`;
  if (rate < 10) return `${rate.toFixed(1)}/分`;
  return `${Math.round(rate)}/分`;
};

// 格式化百分比
export const formatPercent = (value: number, decimal: number = 0): string => {
  return `${value.toFixed(decimal)}%`;
};

// 格式化电力单位
export const formatPower = (watts: number): string => {
  if (watts >= 1000000000) {
    return `${(watts / 1000000000).toFixed(1)}GW`;
  } else if (watts >= 1000000) {
    return `${(watts / 1000000).toFixed(1)}MW`;
  } else if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)}kW`;
  }
  return `${watts}W`;
};

// 格式化流体单位
export const formatFluid = (units: number): string => {
  if (units >= 1000) {
    return `${(units / 1000).toFixed(1)}k`;
  }
  return units.toString();
};

// 获取状态颜色
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'producing': '#4caf50',
    'running': '#4caf50',
    'stopped': '#f44336',
    'insufficient': '#ff9800',
    'inventory_full': '#2196f3',
    'researching': '#9c27b0',
    'no-fuel': '#ff5722',
    'no-power': '#ffc107',
    'no-input': '#ff9800',
    'normal': '#757575'
  };
  return statusColors[status] || '#757575';
};

// 获取状态文本
export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'producing': '生产中',
    'running': '运行中',
    'stopped': '已停止',
    'insufficient': '原料不足',
    'inventory_full': '库存已满',
    'researching': '研究中',
    'no-fuel': '燃料不足',
    'no-power': '电力不足',
    'no-input': '缺少输入',
    'normal': '正常'
  };
  return statusTexts[status] || status;
};