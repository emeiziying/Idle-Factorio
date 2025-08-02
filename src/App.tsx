import React from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

import ProductionModule from '@/components/production/ProductionModule';
import FacilitiesModule from '@/components/facilities/FacilitiesModule';
import TechnologyModule from '@/components/technology/TechnologyModule';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorScreen from '@/components/common/ErrorScreen';
import ClearGameButton from '@/components/common/ClearGameButton';
import { useLocalStorageState } from 'ahooks';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAutoSaveBeforeUnload } from '@/hooks/useAutoSaveBeforeUnload';
import theme from '@/theme';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useLocalStorageState('app-current-module', {
    defaultValue: 0,
  });
  const { isAppReady, initError } = useAppInitialization();
  useAutoSaveBeforeUnload();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentModule(newValue);
  };

  if (initError) {
    return (
      <ErrorScreen
        withTheme
        error={`初始化失败: ${initError}`}
        showRetry
        retryText="重新加载"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!isAppReady) {
    return (
      <LoadingScreen
        withTheme
        message="正在初始化游戏系统..."
        subtitle="请稍候，首次加载可能需要几秒钟"
      />
    );
  }

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

        {import.meta.env.DEV && <ClearGameButton />}
      </Box>
    </ThemeProvider>
  );
};

export default App;
