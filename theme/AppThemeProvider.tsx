import { Global } from '@emotion/react';
import type { PaletteMode } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ColorModeProvider } from 'context/darkMode';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { createThemeLightSensitive } from 'theme';
import cssVariables from 'theme/cssVariables';
import { setDarkMode } from 'theme/darkMode';
import { monoFont, serifFont } from 'theme/fonts';

export function AppThemeProvider({ children, forceTheme }: { children: React.ReactNode; forceTheme?: PaletteMode }) {
  // dark mode: https://mui.com/customization/dark-mode/
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<PaletteMode | null>('dark', null);
  const [mode, setMode] = useState<PaletteMode>('dark');

  const toggleColorMode = useCallback(() => {
    setMode((prevMode: PaletteMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      return newMode;
    });
  }, []);

  // Update the theme only if the mode changes
  const theme = useMemo(() => {
    const muiTheme = createThemeLightSensitive(forceTheme || mode);

    if (typeof window !== 'undefined') {
      setSavedDarkMode(mode);
      setDarkMode(mode === 'dark');
    }
    return muiTheme;
  }, [mode, forceTheme]);

  useEffect(() => {
    if (savedDarkMode) {
      setMode(savedDarkMode);
    }
  }, [savedDarkMode]);

  return (
    <ColorModeProvider toggleColorMode={toggleColorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme={true} />
        <Global styles={cssVariables} />

        <span className={`${serifFont.variable} ${monoFont.variable}`}>{children}</span>
      </ThemeProvider>
    </ColorModeProvider>
  );
}
