import type { Preview } from '@storybook/react';
import React from 'react';
import '../theme/styles.scss';
import { AppThemeProvider } from '../theme/AppThemeProvider';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#262626' },
        { name: 'light', value: '#fff' }
      ]
    },
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
