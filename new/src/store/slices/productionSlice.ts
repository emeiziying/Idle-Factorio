import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProducerInfo, ConsumerInfo, ProductionRate, MachineType } from '../../types';

interface ProductionState {
  producers: Record<string, ProducerInfo[]>;  // itemId -> producers
  consumers: Record<string, ConsumerInfo[]>;  // itemId -> consumers
  rates: Record<string, ProductionRate>;       // itemId -> rates
}

const initialState: ProductionState = {
  producers: {
    // 示例：铁板生产
    iron_plate: [
      {
        machineId: 'furnace-1',
        machineType: MachineType.FURNACE,
        count: 5,
        rate: 0.625,  // 每个熔炉每秒0.625个铁板
        efficiency: 100
      }
    ]
  },
  consumers: {
    // 示例：铁板消耗（用于制作齿轮）
    iron_plate: [
      {
        recipeId: 'iron_gear_wheel',
        productName: '铁齿轮',
        machineType: MachineType.ASSEMBLING_MACHINE,
        rate: 2,  // 每秒消耗2个铁板
        percentage: 100
      }
    ]
  },
  rates: {
    iron_plate: {
      production: 3.125,  // 5 * 0.625
      consumption: 2,
      net: 1.125
    }
  }
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    addProducer: (state, action: PayloadAction<{
      itemId: string;
      producer: ProducerInfo;
    }>) => {
      const { itemId, producer } = action.payload;
      if (!state.producers[itemId]) {
        state.producers[itemId] = [];
      }
      state.producers[itemId].push(producer);
      updateRates(state, itemId);
    },
    
    removeProducer: (state, action: PayloadAction<{
      itemId: string;
      machineId: string;
    }>) => {
      const { itemId, machineId } = action.payload;
      if (state.producers[itemId]) {
        state.producers[itemId] = state.producers[itemId].filter(
          p => p.machineId !== machineId
        );
        updateRates(state, itemId);
      }
    },
    
    addConsumer: (state, action: PayloadAction<{
      itemId: string;
      consumer: ConsumerInfo;
    }>) => {
      const { itemId, consumer } = action.payload;
      if (!state.consumers[itemId]) {
        state.consumers[itemId] = [];
      }
      state.consumers[itemId].push(consumer);
      updateRates(state, itemId);
    },
    
    removeConsumer: (state, action: PayloadAction<{
      itemId: string;
      recipeId: string;
    }>) => {
      const { itemId, recipeId } = action.payload;
      if (state.consumers[itemId]) {
        state.consumers[itemId] = state.consumers[itemId].filter(
          c => c.recipeId !== recipeId
        );
        updateRates(state, itemId);
      }
    },
    
    updateProducerCount: (state, action: PayloadAction<{
      itemId: string;
      machineId: string;
      count: number;
    }>) => {
      const { itemId, machineId, count } = action.payload;
      const producer = state.producers[itemId]?.find(p => p.machineId === machineId);
      if (producer) {
        producer.count = count;
        updateRates(state, itemId);
      }
    }
  }
});

// 辅助函数：更新生产速率
function updateRates(state: ProductionState, itemId: string) {
  const producers = state.producers[itemId] || [];
  const consumers = state.consumers[itemId] || [];
  
  const production = producers.reduce((sum, p) => sum + p.rate * p.count, 0);
  const consumption = consumers.reduce((sum, c) => sum + c.rate, 0);
  
  state.rates[itemId] = {
    production,
    consumption,
    net: production - consumption
  };
  
  // 更新消费者百分比
  if (consumption > 0) {
    consumers.forEach(consumer => {
      consumer.percentage = (consumer.rate / consumption) * 100;
    });
  }
}

export const {
  addProducer,
  removeProducer,
  addConsumer,
  removeConsumer,
  updateProducerCount
} = productionSlice.actions;

export default productionSlice.reducer;