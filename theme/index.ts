import { PaletteMode, Theme as MaterialUITheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { darken } from '@mui/system';
import {
  backgroundColor,
  backgroundColorDarkMode, backgroundDarkColor, backgroundDarkColorDarkMode, backgroundLightColor,
  backgroundLightColorDarkMode, blueColor, BrandColors,
  darkBlueColor, darkModeColors, lightModeColors, primaryTextColor,
  primaryTextColorDarkMode, settingsHeaderBackgroundColor,
  settingsHeaderBackgroundColorDarkMode
} from './colors';
import { darkTheme as darkThemeFocalBoard, lightTheme as lightThemeFocalBoard } from './focalboard/theme';

// Re-declare the emotion theme to have the properties of the MaterialUiTheme - https://emotion.sh/docs/typescript#define-a-theme
declare module '@emotion/react' {
  export interface Theme extends MaterialUITheme {}
}

type FocalBoardColors = typeof darkThemeFocalBoard;

interface CustomColors extends FocalBoardColors, Record<BrandColors, any> {
  settingsHeader: {
    background: string
  };
  sidebar: {
    avatarHighlight: string;
    background: string;
  };
  code: {
    color: string
    background: string
  },
  emoji: {
    hoverBackground: string
  }
}

// define custom colors: https://material-ui.com/customization/palette/
declare module '@mui/material/styles/createPalette' {
  interface PaletteOptions extends CustomColors {
    blue: PaletteOptions['primary'];
    facebook: PaletteOptions['primary'];
    twitter: PaletteOptions['primary'];
    white: PaletteOptions['primary'];
  }
  interface Palette extends CustomColors {
    blue: Palette['primary'];
    facebook: Palette['primary'];
    twitter: Palette['primary'];
    white: Palette['primary'];
  }
  interface TypeBackground {
    light: string
    dark: string
  }
}

// Extend color prop on components
declare module '@mui/material/Chip' {
  export interface ChipPropsColorOverrides extends Record<BrandColors, true> {
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
export const createThemeLightSensitive = (mode: PaletteMode) => createTheme({
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  },
  typography: {
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
    fontSize: 12,
    htmlFontSize: 14,
    h1: {
      fontSize: '2rem',
      fontWeight: 500
    },
    h2: {
      fontSize: '1.05rem',
      fontWeight: 500
    },
    subtitle1: {
      fontSize: '0.85rem',
      fontWeight: 600
    },
    subtitle2: {
      opacity: 0.65,
      fontSize: '0.8rem',
      fontWeight: 400
    }
  },
  palette: {
    mode,
    action: {
      focus: mode === 'dark' ? 'rgb(29, 92, 132)' : 'rgb(29, 92, 132, 0.1)', // darken(backgroundLightColor, 0.1)
      hover: mode === 'dark' ? '#5b5f62' : '#e2e6e9',
      selected: mode === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(22, 52, 71, 0.06)'
    },
    background: {
      default: mode === 'dark' ? backgroundColorDarkMode : backgroundColor,
      light: mode === 'dark' ? backgroundLightColorDarkMode : backgroundLightColor,
      dark: mode === 'dark' ? backgroundDarkColorDarkMode : backgroundDarkColor
    },
    text: {
      primary: mode === 'dark' ? primaryTextColorDarkMode : primaryTextColor
    },
    twitter: {
      contrastText: '#ffffff',
      dark: darken('#00aced', 0.1),
      main: '#00aced'
    },
    facebook: {
      contrastText: '#ffffff',
      dark: darken('#3b5998', 0.1),
      main: '#3b5998'
    },
    primary: {
      main: blueColor // '#010101',
    },
    secondary: {
      main: mode === 'dark' ? '#999' : '#888'
    },
    white: {
      main: '#eee'
    },
    blue: {
      main: mode === 'dark' ? darkModeColors.blue : lightModeColors.blue,
      contrastText: '#ffffff' // Contrast text needs to be defined in the palette, otherwise consumers like Chip will throw an error, as contrast text is undefined
    },
    red: {
      main: mode === 'dark' ? darkModeColors.red : lightModeColors.red,
      contrastText: '#ffffff'
    },
    gray: {
      main: mode === 'dark' ? darkModeColors.gray : lightModeColors.gray,
      contrastText: '#ffffff'
    },
    brown: {
      main: mode === 'dark' ? darkModeColors.brown : lightModeColors.brown,
      contrastText: '#ffffff'
    },
    orange: {
      main: mode === 'dark' ? darkModeColors.orange : lightModeColors.orange,
      contrastText: '#ffffff'
    },
    yellow: {
      main: mode === 'dark' ? darkModeColors.yellow : lightModeColors.yellow,
      contrastText: '#ffffff'
    },
    green: {
      main: mode === 'dark' ? darkModeColors.green : lightModeColors.green,
      contrastText: '#ffffff'
    },
    purple: {
      main: mode === 'dark' ? darkModeColors.purple : lightModeColors.purple,
      contrastText: '#ffffff'
    },
    pink: {
      main: mode === 'dark' ? darkModeColors.pink : lightModeColors.pink,
      contrastText: '#ffffff'
    },
    // custom components
    settingsHeader: {
      background: mode === 'dark' ? settingsHeaderBackgroundColorDarkMode : settingsHeaderBackgroundColor
    },
    sidebar: {
      avatarHighlight: mode === 'dark' ? 'rgba(255, 255, 255, .2)' : '#ccc',
      background: mode === 'dark' ? backgroundLightColorDarkMode : backgroundLightColor
    },
    code: {
      color: '#EB5757',
      background: mode === 'dark' ? backgroundDarkColorDarkMode : backgroundDarkColor
    },
    emoji: {
      hoverBackground: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04);'
    },
    ...(mode === 'dark' ? darkThemeFocalBoard : lightThemeFocalBoard)
  },
  components: {
    // MuiTypography: {
    //   styleOverrides: {
    //     root: {
    //       whiteSpace: 'nowrap'
    //     }
    //   }
    // },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        variant: 'contained'
      },
      styleOverrides: {
        root: {
          borderRadius: '10px'
        }
      }
    },
    MuiChip: {
      defaultProps: {
        // @ts-ignore mui library type is wrong
        disableRipple: true
      }
    },
    MuiListItemButton: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? backgroundDarkColorDarkMode : backgroundDarkColor
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        popper: {
          zIndex: 3000
        }
      }
    },
    MuiPopover: {
      styleOverrides: {
        root: {
          zIndex: 3000
        }
      }
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: 16
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: '10px 10px',
          fontSize: 16
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: darkBlueColor,
          '&:hover': {
            color: darken(darkBlueColor, 0.2)
          }
        }
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
});
