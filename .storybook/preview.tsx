import type { Preview } from '@storybook/react';
import React, { useMemo } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { createThemeLightSensitive } from '../theme';
import { monoFont, serifFont } from '../theme/fonts';
import 'theme/styles.scss';

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
  const theme = useMemo(() => THEMES[themeKey] || THEMES['light'], [themeKey]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={`${serifFont.variable} ${monoFont.variable}`}>
        <Story />
      </Box>
    </ThemeProvider>
  );
};

export const decorators = [withMuiTheme];
