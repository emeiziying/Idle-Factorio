import { createTheme } from '@mui/material/styles';

// 扩展主题类型
declare module '@mui/material/styles' {
  interface Theme {
    customStyles: {
      appContainer: React.CSSProperties;
      pageContainer: React.CSSProperties;
      typography: {
        compact: React.CSSProperties;
        small: React.CSSProperties;
        tiny: React.CSSProperties;
        subtitle: React.CSSProperties;
      };
      spacing: {
        compact: number;
        tight: number;
      };
      layout: {
        cardCompact: React.CSSProperties;
        inventoryInfo: React.CSSProperties;
      };
    };
  }

  interface ThemeOptions {
    customStyles?: {
      appContainer?: React.CSSProperties;
      pageContainer?: React.CSSProperties;
      typography?: {
        compact?: React.CSSProperties;
        small?: React.CSSProperties;
        tiny?: React.CSSProperties;
        subtitle?: React.CSSProperties;
      };
      spacing?: {
        compact?: number;
        tight?: number;
      };
      layout?: {
        cardCompact?: React.CSSProperties;
        inventoryInfo?: React.CSSProperties;
      };
    };
  }
}

// 创建移动端优化的深色主题
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff9800',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#2a2a2a',
      paper: '#3a3a3a',
    },
  },
  // 自定义样式变量
  customStyles: {
    appContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
    },
    pageContainer: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '56px',
    },
    typography: {
      compact: {
        fontSize: '0.8rem',
        fontWeight: 600,
      },
      small: {
        fontSize: '0.75rem',
      },
      tiny: {
        fontSize: '0.65rem',
      },
      subtitle: {
        fontSize: '0.8rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
      },
    },
    spacing: {
      compact: 0.5,
      tight: 0.25,
    },
    layout: {
      cardCompact: {
        marginBottom: '0.5rem',
        padding: '0.5rem',
      },
      inventoryInfo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: '60px',
      },
    },
  },
  components: {
    // 全局移除outline
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
    // 底部导航组件 - 移动端优化
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          width: '100%',
          position: 'static',
          borderTop: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          minHeight: '56px',
          '@media (max-width: 600px)': {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          paddingTop: 8,
          paddingBottom: 8,
          outline: 'none',
          flex: 1,
          '&:focus': {
            outline: 'none',
          },
        },
        label: {
          fontSize: '0.65rem',
          opacity: 1,
          '&.Mui-selected': {
            fontSize: '0.7rem',
            fontWeight: 600,
          },
        },
      },
    },
    // Tab组件移除outline
    MuiTab: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
    // 卡片组件移除outline
    MuiCard: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          // 移动端更小的圆角
          '@media (max-width: 600px)': {
            borderRadius: 8,
          },
        },
      },
    },
    // 对话框组件移除outline
    MuiDialog: {
      styleOverrides: {
        paper: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          // 移动端全屏对话框
          '@media (max-width: 600px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    // 图标按钮移除outline
    MuiIconButton: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
  },
});

export default theme;
