import type { Preview } from '@storybook/react';
import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createThemeLightSensitive } from '../theme';
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

export const withMuiTheme = (Story) => (
  <ThemeProvider theme={createThemeLightSensitive('light')}>
    <CssBaseline />
    <Story />
  </ThemeProvider>
);

export const decorators = [withMuiTheme];
