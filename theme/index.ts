import type { PaletteMode, Theme as MaterialUITheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { darken } from '@mui/system';

import type { BrandColor } from './colors';
import {
  backgroundColor,
  backgroundColorDarkMode,
  backgroundDarkColor,
  backgroundDarkColorDarkMode,
  backgroundLightColor,
  backgroundLightColorDarkMode,
  blueColor,
  colors,
  darkBlueColor,
  primaryTextColor,
  primaryTextColorDarkMode,
  secondaryTextColor,
  secondaryTextColorDarkMode,
  settingsHeaderBackgroundColor,
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
    background: string;
  };
  sidebar: {
    avatarHighlight: string;
    background: string;
  };
  code: {
    color: string;
    background: string;
  };
  emoji: {
    hoverBackground: string;
  };
  templateBanner: {
    background: string;
    text: string;
    highlightedText: string;
    fontSize: string;
  };
}

// define custom colors: https://material-ui.com/customization/palette/
declare module '@mui/material/styles/createPalette' {
  interface PaletteOptions extends CustomColors {
    blue: PaletteOptions['primary'];
    facebook: PaletteOptions['primary'];
    discord: PaletteOptions['primary'];
    textPrimary: PaletteOptions['primary'];
    twitter: PaletteOptions['primary'];
    white: PaletteOptions['primary'];
    quoteMarker: PaletteOptions['primary'];
  }
  interface Palette extends CustomColors {
    blue: Palette['primary'];
    facebook: Palette['primary'];
    discord: Palette['primary'];
    textPrimary: Palette['primary'];
    twitter: Palette['primary'];
    white: Palette['primary'];
    quoteMarker: Palette['primary'];
  }
  interface TypeBackground {
    light: string;
    dark: string;
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

export const fontFamily =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
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
        fontWeight: 700
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
      discord: {
        contrastText,
        dark: darken('#5765f2', 0.1),
        main: '#5765f2'
      },
      primary: {
        main: blueColor // '#010101',
      },
      secondary: {
        main: mode === 'dark' ? secondaryTextColorDarkMode : secondaryTextColor
      },
      white: {
        main: '#eee'
      },
      blue: {
        main: colors.blue[mode || 'light'],
        contrastText // Contrast text needs to be defined in the palette, otherwise consumers like Chip will throw an error, as contrast text is undefined
      },
      red: {
        main: colors.red[mode || 'light'],
        contrastText
      },
      gray: {
        main: colors.gray[mode || 'light'],
        contrastText
      },
      turquoise: {
        main: colors.turquoise[mode || 'light'],
        contrastText
      },
      orange: {
        main: colors.orange[mode || 'light'],
        contrastText
      },
      yellow: {
        main: colors.yellow[mode || 'light'],
        contrastText
      },
      teal: {
        main: colors.teal[mode || 'light'],
        dark: darken(colors.teal[mode || 'light'], 0.05),
        contrastText
      },
      purple: {
        main: colors.purple[mode || 'light'],
        contrastText
      },
      pink: {
        main: colors.pink[mode || 'light'],
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
      templateBanner: {
        background: mode === 'dark' ? '#373C3F' : '#FBF8F3',
        // Slightly transparent text
        text: mode === 'dark' ? '#FFFFFF70' : '#37352FA6',
        highlightedText: mode === 'dark' ? '#FFFFFFCF' : '#37352F',
        fontSize: '14px'
      },
      ...(mode === 'dark' ? darkThemeFocalBoard : lightThemeFocalBoard)
    },
    components: {
      MuiAvatar: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            ...(ownerState?.variant === 'rounded' && {
              borderRadius: 10
            })
          })
        }
      },
      MuiAutocomplete: {
        defaultProps: {
          blurOnSelect: 'touch'
        },
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
        },
        styleOverrides: {
          groupedContained: {
            '&:not(:last-child)': {
              borderRightColor: 'rgba(0, 0, 0, .2)'
            }
          }
        }
      },
      MuiButton: {
        defaultProps: {
          variant: 'contained'
        },
        styleOverrides: {
          root: {
            textTransform: 'none'
          },
          text: {
            ':hover': {
              backgroundColor: 'var(--input-bg)'
            }
            // borderRadius: '10px'
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            ':hover': {
              backgroundColor: 'var(--input-bg)'
            }
          }
        },
        defaultProps: {
          color: 'inherit' // set to inherit, the default is rgba (0,0,0, .54) which makes icons half-opaque
        }
      },
      MuiMenuItem: {
        defaultProps: {
          dense: true
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
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            fontSize: 'inherit',
            minWidth: '30px !important'
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
