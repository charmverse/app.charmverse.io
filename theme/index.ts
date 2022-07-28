import { PaletteMode, Theme as MaterialUITheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { darken } from '@mui/system';
import {
  backgroundColor,
  backgroundColorDarkMode, backgroundDarkColor, backgroundDarkColorDarkMode, backgroundLightColor,
  backgroundLightColorDarkMode, blueColor, BrandColor,
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

interface CustomColors extends FocalBoardColors, Record<BrandColor, any> {
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
    textPrimary: PaletteOptions['primary'];
    twitter: PaletteOptions['primary'];
    white: PaletteOptions['primary'];
    quoteMarker: PaletteOptions['primary'];
  }
  interface Palette extends CustomColors {
    blue: Palette['primary'];
    facebook: Palette['primary'];
    textPrimary: Palette['primary'];
    twitter: Palette['primary'];
    white: Palette['primary'];
    quoteMarker: Palette['primary'];
  }
  interface TypeBackground {
    light: string
    dark: string
  }
}

// Extend color prop on components
declare module '@mui/material/Chip' {
  export interface ChipPropsColorOverrides extends Record<BrandColor, true> {
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

declare module '@mui/material/SvgIcon' {
  export interface SvgIconPropsColorOverrides extends Record<BrandColor, true> {}
}

export const fontFamily = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
// Explore all theme options: https://material-ui.com/customization/default-theme/
export const createThemeLightSensitive = (mode: PaletteMode) => {
  const contrastText = mode === 'dark' ? '#fff' : '#000';

  return createTheme({
    shape: {
      borderRadius: 3 // defaults to 4
    },
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
      fontFamily,
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
        hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.055)' : 'rgba(22, 52, 71, 0.07)',
        selected: mode === 'dark' ? 'rgba(255, 255, 255, 0.055)' : 'rgba(22, 52, 71, 0.07)'
      },
      background: {
        default: mode === 'dark' ? backgroundColorDarkMode : backgroundColor,
        paper: mode === 'dark' ? backgroundLightColorDarkMode : backgroundColor,
        light: mode === 'dark' ? backgroundLightColorDarkMode : backgroundLightColor,
        dark: mode === 'dark' ? backgroundDarkColorDarkMode : backgroundDarkColor
      },
      text: {
        primary: mode === 'dark' ? primaryTextColorDarkMode : primaryTextColor
      },
      textPrimary: {
        main: mode === 'dark' ? primaryTextColorDarkMode : primaryTextColor
      },
      twitter: {
        contrastText,
        dark: darken('#00aced', 0.1),
        main: '#00aced'
      },
      facebook: {
        contrastText,
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
        contrastText // Contrast text needs to be defined in the palette, otherwise consumers like Chip will throw an error, as contrast text is undefined
      },
      red: {
        main: mode === 'dark' ? darkModeColors.red : lightModeColors.red,
        contrastText
      },
      gray: {
        main: mode === 'dark' ? darkModeColors.gray : lightModeColors.gray,
        contrastText
      },
      turquoise: {
        main: mode === 'dark' ? darkModeColors.turquoise : lightModeColors.turquoise,
        contrastText
      },
      orange: {
        main: mode === 'dark' ? darkModeColors.orange : lightModeColors.orange,
        contrastText
      },
      yellow: {
        main: mode === 'dark' ? darkModeColors.yellow : lightModeColors.yellow,
        contrastText
      },
      teal: {
        main: mode === 'dark' ? darkModeColors.teal : lightModeColors.teal,
        contrastText
      },
      purple: {
        main: mode === 'dark' ? darkModeColors.purple : lightModeColors.purple,
        contrastText
      },
      pink: {
        main: mode === 'dark' ? darkModeColors.pink : lightModeColors.pink,
        contrastText
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
      quoteMarker: {
        main: mode === 'dark' ? '#F3EFF5' : '#111111'
      },
      ...(mode === 'dark' ? darkThemeFocalBoard : lightThemeFocalBoard)
    },
    components: {
      MuiAutocomplete: {
        styleOverrides: {
          popper: {
            zIndex: 'var(--z-index-speedDial)'
          }
        }
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true
        }
      },
      MuiButtonGroup: {
        defaultProps: {
          disableRipple: true
        }
      },
      MuiButton: {
        defaultProps: {
          variant: 'contained'
        },
        styleOverrides: {
          root: {
            textTransform: 'none'
            // borderRadius: '10px'
          }
        }
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
          placement: 'top'
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '3px'
          }
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
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // this makes the text look lighter
            MozOsxFontSmoothing: 'none'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            padding: '8px'
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            fontSize: 'inherit',
            minWidth: '30px'
          }
        }
      },
      MuiInput: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiOutlinedInput: {
        defaultProps: {
          size: 'small'
        },
        styleOverrides: {
          root: {
            backgroundColor: 'var(--input-bg)',
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--input-border)'
            }
          },
          notchedOutline: {
            borderColor: 'var(--input-border)'
          }
        }
      },
      MuiSelect: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 0,
            textTransform: 'none'
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
};
