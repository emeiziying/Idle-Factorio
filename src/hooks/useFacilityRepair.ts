import { useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';

/**
 * 安全修复设施状态的hook
 * 在组件挂载后延迟执行，避免在渲染期间更新状态
 */
export const useFacilityRepair = () => {
  const { _repairFacilityState } = useGameStore();
  const hasRepaired = useRef(false);

  useEffect(() => {
    // 延迟执行修复，避免在渲染期间更新状态
    const timer = setTimeout(() => {
      if (!hasRepaired.current) {
        _repairFacilityState();
        hasRepaired.current = true;
      }
    }, 100); // 100ms延迟，确保组件完全挂载

    return () => clearTimeout(timer);
  }, [_repairFacilityState]);

  return { repairFacilities: _repairFacilityState };
}; 