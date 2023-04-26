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
import { AppThemeProvider } from '../theme/AppThemeProvider';

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

export const withMuiTheme = (Story, context) => {
  return (
    <AppThemeProvider forceTheme={context.globals.theme}>
      <Story />
    </AppThemeProvider>
  );
};

export const decorators = [withMuiTheme];
