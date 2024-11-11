import { createTheme, darken, lighten } from '@mui/material/styles';

import {
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  brandColor,
  disabledTextColorDarkMode,
  primaryTextColorDarkMode,
  purpleDisabled,
  secondaryText,
  secondaryLightText,
  blackText,
  secondaryDarkText,
  inputBackgroundDarkMode
} from './colors';

// Create a simplified version of the theme for server-side rendering
export const serverTheme = createTheme({
  colorSchemes: {
    dark: {
      // palette for dark mode
      palette: {
        background: {
          default: backgroundColorDarkMode,
          paper: backgroundLightColorDarkMode,
          dark: darken(backgroundLightColorDarkMode, 0.25),
          light: lighten(backgroundColorDarkMode, 0.125) // this # is based on the background needed for Info pages
        },
        text: {
          primary: primaryTextColorDarkMode,
          secondary: secondaryText,
          disabled: disabledTextColorDarkMode
        },
        primary: {
          main: brandColor,
          dark: purpleDisabled
        },
        secondary: {
          main: secondaryText,
          light: secondaryLightText,
          dark: secondaryDarkText
        },
        inputBackground: {
          main: inputBackgroundDarkMode
        },
        black: {
          main: blackText,
          dark: '#000'
        },
        orange: {
          main: '#FFAC81'
        },
        green: {
          main: '#85FF9E'
        }
      }
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  }
});
