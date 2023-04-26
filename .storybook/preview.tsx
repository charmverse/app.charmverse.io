import type { Preview } from '@storybook/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { createThemeLightSensitive } from '../theme';
import { monoFont, serifFont } from '../theme/fonts';
import cssVariables from '../theme/cssVariables';
import { setDarkMode } from '../theme/darkMode';
import '../theme/styles.scss';
import { Global } from '@emotion/react';
import { ColorModeContext } from '../context/darkMode';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  }
};

export default preview;

export const globalTypes = {
  theme: {
    name: 'Theme',
    title: 'Theme',
    description: 'Theme for your components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      dynamicTitle: true,
      items: [
        { value: 'light', left: '☀️', title: 'Light mode' },
        { value: 'dark', left: '🌙', title: 'Dark mode' }
      ]
    }
  }
};

const THEMES = {
  light: createThemeLightSensitive('light'),
  dark: createThemeLightSensitive('dark')
};

export const withMuiTheme = (Story, context) => {
  const { theme: themeKey } = context.globals;
  const [savedDarkMode, setSavedDarkMode] = useState<PaletteMode>('dark');
  const [mode, setMode] = useState<PaletteMode>('dark');
  const colorModeContext = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          return newMode;
        });
      }
    }),
    []
  );

  useEffect(() => {
    if (savedDarkMode) {
      setMode(savedDarkMode);
    }
  }, [savedDarkMode]);
  const dupa = useMemo(() => {
    if (typeof window !== 'undefined') {
      setSavedDarkMode(mode);
      setDarkMode(mode === 'dark');
    }
    return THEMES[themeKey] || THEMES['light'];
  }, [mode, themeKey]);
  return (
    <ColorModeContext.Provider value={colorModeContext}>
      <ThemeProvider theme={dupa}>
        <CssBaseline enableColorScheme={true} />
        <Global styles={cssVariables} />
        <Box className={`${serifFont.variable} ${monoFont.variable}`}>
          <Story />
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const decorators = [withMuiTheme];
