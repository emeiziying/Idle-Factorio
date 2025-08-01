import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import TechVirtualizedGrid from './TechVirtualizedGrid';
import type { Technology, TechStatus } from '../../types/technology';

interface TechVirtualizedGridWithAutoSizerProps {
  /** 要显示的科技列表 */
  technologies: Technology[];

  /** 科技状态映射 */
  techStates: Map<string, { status: TechStatus; progress?: number }>;

  /** 研究队列中的科技ID */
  queuedTechIds: Set<string>;

  /** 点击科技卡片的回调 */
  onTechClick?: (techId: string) => void;
}

const TechVirtualizedGridWithAutoSizer: React.FC<TechVirtualizedGridWithAutoSizerProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick,
}) => {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <TechVirtualizedGrid
            technologies={technologies}
            techStates={techStates}
            queuedTechIds={queuedTechIds}
            onTechClick={onTechClick}
            height={height}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default TechVirtualizedGridWithAutoSizer;
