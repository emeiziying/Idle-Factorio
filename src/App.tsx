import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import React from 'react';

import ClearGameButton from '@/components/common/ClearGameButton';
import ExperimentalRuntimeDebugPanel from '@/components/common/ExperimentalRuntimeDebugPanel';
import FacilitiesModule from '@/components/facilities/FacilitiesModule';
import ProductionModule from '@/components/production/ProductionModule';
import TechnologyModule from '@/components/technology/TechnologyModule';
import { APP_STORAGE_KEYS } from '@/constants/storageKeys';
import { useAutoSaveBeforeUnload } from '@/hooks/useAutoSaveBeforeUnload';
import theme from '@/theme';
import { useLocalStorageState } from 'ahooks';

const App: React.FC = () => {
  // 当前模块
  const [currentModule, setCurrentModule] = useLocalStorageState(APP_STORAGE_KEYS.CURRENT_MODULE, {
    defaultValue: 0,
  });
  // 自动保存游戏进度
  useAutoSaveBeforeUnload();

  // 切换模块
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentModule(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={theme.customStyles.appContainer}>
        <Box sx={theme.customStyles.pageContainer}>
          {currentModule === 0 && <ProductionModule />}
          {currentModule === 1 && <FacilitiesModule />}
          {currentModule === 2 && <TechnologyModule />}
        </Box>

        <BottomNavigation value={currentModule} onChange={handleTabChange} showLabels>
          <BottomNavigationAction label="生产" icon={<BuildIcon />} showLabel={true} />
          <BottomNavigationAction label="设施" icon={<FactoryIcon />} showLabel={true} />
          <BottomNavigationAction label="科技" icon={<ScienceIcon />} showLabel={true} />
        </BottomNavigation>

        {import.meta.env.DEV && <ExperimentalRuntimeDebugPanel />}
        {import.meta.env.DEV && <ClearGameButton />}
      </Box>
    </ThemeProvider>
  );
};

export default App;
