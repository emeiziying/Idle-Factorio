import type { CSSProperties } from 'react';

interface CustomStyles {
  appContainer: CSSProperties;
  pageContainer: CSSProperties;
  typography: {
    compact: CSSProperties;
    small: CSSProperties;
    tiny: CSSProperties;
    subtitle: CSSProperties;
  };
  spacing: {
    compact: number;
    tight: number;
  };
  layout: {
    cardCompact: CSSProperties;
    inventoryInfo: CSSProperties;
  };
}

declare module '@mui/material/styles/createThemeNoVars' {
  interface Theme {
    customStyles: CustomStyles;
  }

  interface ThemeOptions {
    customStyles?: CustomStyles;
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    customStyles: CustomStyles;
  }

  interface ThemeOptions {
    customStyles?: CustomStyles;
  }
}

declare module '@mui/system' {
  interface Theme {
    customStyles: CustomStyles;
  }
}
