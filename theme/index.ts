import { PaletteMode, Theme as MaterialUITheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { darken } from '@mui/system';
import {
  backgroundColor,
  backgroundColorDarkMode, blueColor,
  darkBlueColor, primaryTextColor,
  primaryTextColorDarkMode, settingsHeaderBackgroundColor,
  settingsHeaderBackgroundColorDarkMode, sidebarBackgroundColor,
  sidebarBackgroundColorDarkMode
} from './colors';

// Re-declare the emotion theme to have the properties of the MaterialUiTheme - https://emotion.sh/docs/typescript#define-a-theme
declare module '@emotion/react' {
  export interface Theme extends MaterialUITheme {}
}

interface CustomColors {
  settingsHeader: {
    background: string
  };
  sidebar: {
    avatarHighlight: string;
    background: string;
  };
}

// define custom colors: https://material-ui.com/customization/palette/
declare module '@mui/material/styles/createPalette' {
  interface Palette extends CustomColors {
    blue: Palette['primary'];
    facebook: Palette['primary'];
    twitter: Palette['primary'];
    white: PaletteOptions['primary'];
  }
  interface PaletteOptions extends CustomColors {
    blue: PaletteOptions['primary'];
    facebook: PaletteOptions['primary'];
    twitter: PaletteOptions['primary'];
    white: PaletteOptions['primary'];
  }
}

// Extend color prop on components
declare module '@mui/material/Chip' {
  export interface ChipPropsColorOverrides {
    facebook: true;
    twitter: true;
  }
}

declare module '@mui/material/IconButton' {
  export interface IconButtonPropsColorOverrides {
    blue: true;
    white: true;
  }
}

// Explore all theme options: https://material-ui.com/customization/default-theme/
export const createThemeLightSensitive = (mode: PaletteMode) =>
  createTheme({
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      }
    },
    typography: {
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
      htmlFontSize: 14,
      h1: {
        fontSize: '2rem',
        fontWeight: 500
      },
      h2: {
        fontSize: '1.05rem',
        fontWeight: 500
      }
    },
    palette: {
      mode,
      background: {
        default: mode === 'dark' ? backgroundColorDarkMode : backgroundColor
      },
      text: {
        primary: mode === 'dark' ? primaryTextColorDarkMode : primaryTextColor,
      },
      twitter: {
        contrastText: '#ffffff',
        dark: darken('#00aced', 0.1),
        main: '#00aced',
      },
      facebook: {
        contrastText: '#ffffff',
        dark: darken('#3b5998', 0.1),
        main: '#3b5998',
      },
      primary: {
        main: blueColor, //'#010101',
      },
      secondary: {
        main: '#777',
      },
      blue: {
        main: '#00aced'
      },
      white: {
        main: '#eee'
      },
      // custom components
      settingsHeader: {
        background: mode === 'dark' ? settingsHeaderBackgroundColorDarkMode : settingsHeaderBackgroundColor,
      },
      sidebar: {
        avatarHighlight: mode === 'dark' ? 'rgba(255, 255, 255, .2)' : '#ccc',
        background: mode === 'dark' ? sidebarBackgroundColorDarkMode : sidebarBackgroundColor,
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px'
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true
        },
        styleOverrides: {
          root: {
            borderRadius: '10px'
          }
        }
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            "&:last-child": {
              paddingBottom: 16,
            }
          }
        }
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: darkBlueColor,
            '&:hover': {
              color: darken(darkBlueColor, 0.2),
            }
          }
        },
        defaultProps: {
          underline: 'none'
        }
      }
    }
  });
