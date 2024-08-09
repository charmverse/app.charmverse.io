'use client';

import { grey } from '@mui/material/colors';
import { darken, experimental_extendTheme as extendTheme, responsiveFontSizes } from '@mui/material/styles';

import {
  backgroundColor,
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  blueColor,
  darkBlueColor,
  farcasterBrandColor,
  farcasterBrandColorDark,
  farcasterBrandColorLight,
  inputBackground,
  inputBackgroundDarkMode,
  inputBorder,
  inputBorderDarkMode,
  primaryTextColor,
  primaryTextColorDarkMode,
  secondaryTextColor,
  secondaryTextColorDarkMode,
  sunnysColor,
  sunnysColorLight,
  footerBackground
} from './colors';

export const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

const extendedTheme = extendTheme({
  cssVarPrefix: 'charm',
  colorSchemes: {
    light: {
      // palette for light mode
      palette: {
        action: {
          focus: 'rgb(29, 92, 132, 0.1)',
          hover: 'rgba(22, 52, 71, 0.07)',
          selected: 'rgba(22, 52, 71, 0.07)'
        },
        background: {
          default: backgroundColor,
          paper: backgroundColor
        },
        text: {
          disabled: primaryTextColor,
          primary: primaryTextColor
        },
        primary: {
          main: blueColor
        },
        secondary: {
          main: secondaryTextColor
        },
        textPrimary: {
          main: primaryTextColor
        },
        inputBackground: {
          main: inputBackground
        },
        footerBackground: { main: footerBackground },
        mainBackground: { main: grey[200] },
        farcaster: { main: farcasterBrandColor, dark: farcasterBrandColorDark, light: farcasterBrandColorLight },
        gold: { main: sunnysColor, light: sunnysColorLight }
      }
    },
    dark: {
      // palette for dark mode
      palette: {
        action: {
          focus: 'rgb(29, 92, 132)',
          hover: 'rgba(255, 255, 255, 0.055)',
          selected: 'rgba(255, 255, 255, 0.055)'
        },
        background: {
          default: backgroundColorDarkMode,
          paper: backgroundLightColorDarkMode
        },
        text: {
          disabled: primaryTextColor,
          primary: primaryTextColorDarkMode
        },
        primary: {
          main: darkBlueColor,
          dark: darken(darkBlueColor, 0.2)
        },
        secondary: {
          main: secondaryTextColorDarkMode
        },
        textPrimary: {
          main: primaryTextColorDarkMode
        },
        inputBackground: {
          main: inputBackgroundDarkMode
        },
        footerBackground: { main: footerBackground },
        mainBackground: { main: backgroundColorDarkMode },
        farcaster: { main: farcasterBrandColor, dark: farcasterBrandColorDark, light: farcasterBrandColorLight },
        gold: { main: sunnysColor, light: sunnysColorLight }
      }
    }
  },
  components: {
    MuiPopover: {
      defaultProps: {
        disableRestoreFocus: true
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          marginBottom: 5
        })
      }
    },
    MuiAppBar: {},
    MuiAvatar: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState?.variant === 'rounded' && {
            borderRadius: 10
          }),
          fontWeight: 500
        })
      }
    },
    MuiAutocomplete: {
      defaultProps: {
        blurOnSelect: 'touch'
      },
      styleOverrides: {
        popper: {
          zIndex: '1050'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        // Disable the lightening of the background when elevation is applied
        // source: https://mui.com/material-ui/react-paper/
        root: {
          backgroundImage: 'none'
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
        disableRipple: true,
        disableElevation: true
      },
      styleOverrides: {
        groupedContained: {
          '&:not(:last-child)': {
            borderRightColor: 'rgba(0, 0, 0 / 0.2)'
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true
      },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          textTransform: 'none',
          ...(ownerState.variant === 'contained'
            ? {
                color: theme.vars.palette.textPrimary.disabled,
                backgroundColor: theme.vars.palette.gold.main,
                '&:hover': {
                  backgroundColor: theme.vars.palette.gold.main
                }
              }
            : {})
        }),
        text: ({ theme, variant, color }) => ({
          color: color || (variant === 'outlined' || variant === 'text' ? theme.vars.palette.primary.main : 'inherit')
        })
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover': {
            backgroundColor: theme.vars.palette.inputBackground.main
          }
        })
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
    MuiTypography: {
      defaultProps: {
        color: 'text.primary'
      }
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 1000,
        placement: 'top'
      }
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          // boxShadow: theme.shadows[2]
        })
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
    MuiSkeleton: {
      styleOverrides: {
        root: {
          transform: 'scale(1, 1)'
        }
      }
    },
    MuiOutlinedInput: {
      defaultProps: {
        size: 'small'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.inputBackground.main,
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: inputBorder
          },
          '[data-mui-color-scheme="dark"] &': {
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderDarkMode
            }
          }
        }),
        notchedOutline: () => ({
          borderColor: inputBorder,
          '[data-mui-color-scheme="dark"] &': {
            borderColor: inputBorderDarkMode
          }
        })
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 0
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
        root: ({ theme }) => ({
          color: theme.vars.palette.gold.main,
          '&:hover': {
            color: theme.vars.palette.gold.main
          },
          fontFamily: defaultFont
        })
      },
      defaultProps: {
        underline: 'none',
        color: 'gold.main'
      }
    }
  }
});

export default responsiveFontSizes(extendedTheme) as typeof extendedTheme;
