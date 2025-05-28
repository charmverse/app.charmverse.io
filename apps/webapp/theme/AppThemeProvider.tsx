'use client';

import { Global } from '@emotion/react';
import type { PaletteMode } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ColorModeProvider } from 'hooks/useDarkMode';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { createThemeLightSensitive } from 'theme';
import cssVariables from 'theme/cssVariables';
import { setDarkMode } from 'theme/darkMode';
import { monoFont, serifFont } from 'theme/fonts';

const defaultMode: PaletteMode = 'light';

export function AppThemeProvider({ children, forceTheme }: { children: React.ReactNode; forceTheme?: PaletteMode }) {
  const defaultTheme = forceTheme || defaultMode;
  // dark mode: https://mui.com/customization/dark-mode/
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<PaletteMode | null>(defaultTheme, null);
  const [mode, setMode] = useState<PaletteMode>(defaultTheme);

  const toggleColorMode = useCallback(() => {
    setMode((prevMode: PaletteMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      return newMode;
    });
  }, []);

  // Update the theme only if the mode changes
  const theme = useMemo(() => {
    const muiTheme = createThemeLightSensitive(mode);

    if (typeof window !== 'undefined') {
      setSavedDarkMode(mode);
      setDarkMode(mode === 'dark');
    }
    return muiTheme;
  }, [mode, setSavedDarkMode]);

  useEffect(() => {
    if (savedDarkMode) {
      setMode(savedDarkMode);
    }
  }, [savedDarkMode]);

  return (
    // <AppCacheProvider>
    <ColorModeProvider toggleColorMode={toggleColorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme={true} />
        <Global styles={cssVariables} />

        <span className={`${serifFont.variable} ${monoFont.variable}`}>{children}</span>
      </ThemeProvider>
    </ColorModeProvider>
    // </AppCacheProvider>
  );
}
