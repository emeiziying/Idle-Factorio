// 存储配置数据 - 纯数据文件，不依赖任何服务

import type { StorageConfig } from '@/types/index';

// 存储特定的配置（data.json中没有的信息）
export const STORAGE_SPECIFIC_CONFIGS: { [key: string]: Partial<StorageConfig> } = {
  // 固体存储 - 箱子
  'wooden-chest': {
    category: 'solid',
    additionalStacks: 16, // Factorio中木箱16个格子
    description: '基础存储箱，提供16个额外堆叠的存储空间',
  },
  'iron-chest': {
    category: 'solid',
    additionalStacks: 32, // Factorio中铁箱32个格子
    description: '中级存储箱，提供32个额外堆叠的存储空间',
  },
  'steel-chest': {
    category: 'solid',
    additionalStacks: 48, // Factorio中钢箱48个格子
    description: '高级存储箱，提供48个额外堆叠的存储空间，需要钢铁处理科技',
  },

  // 液体存储 - 储液罐
  'storage-tank': {
    category: 'liquid',
    fluidCapacity: 25000, // Factorio中储液罐容量25,000单位
    dimensions: '3×3', // 储液罐尺寸
    requiredTechnology: 'fluid-handling', // 需要流体处理科技
    description: '液体存储设备，可存储25,000单位的液体，需要流体处理科技',
  },
};
