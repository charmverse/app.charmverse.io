import type { Preview } from '@storybook/react';
import React from 'react';
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

export const withMuiTheme = (Story) => (
  <ThemeProvider theme={createThemeLightSensitive('light')}>
    <CssBaseline />
    <Box className={`${serifFont.variable} ${monoFont.variable}`}>
      <Story />
    </Box>
  </ThemeProvider>
);

export const decorators = [withMuiTheme];
