'use client';

import { darken, extendTheme, responsiveFontSizes } from '@mui/material/styles';

import {
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  brandColor,
  disabledTextColorDarkMode,
  inputBackgroundDarkMode,
  inputBorderDarkMode,
  primaryTextColorDarkMode,
  secondaryTextColorDarkMode
} from './colors';

export const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

const extendedTheme = extendTheme({
  cssVarPrefix: 'charm',
  colorSchemes: {
    dark: {
      // palette for dark mode
      palette: {
        background: {
          default: backgroundColorDarkMode,
          paper: backgroundLightColorDarkMode
        },
        text: {
          disabled: disabledTextColorDarkMode,
          primary: primaryTextColorDarkMode
        },
        primary: {
          main: brandColor,
          dark: darken(brandColor, 0.2)
        },
        secondary: {
          main: secondaryTextColorDarkMode
        },
        inputBackground: {
          main: inputBackgroundDarkMode
        }
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
        root: {
          textTransform: 'none'
        }
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
        root: () => ({
          backgroundColor: inputBackgroundDarkMode,
          '[data-mui-color-scheme="dark"] &': {
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--input-border)'
            }
          }
        }),
        notchedOutline: () => ({
          '[data-mui-color-scheme="dark"] &': {
            borderColor: 'var(--input-border)'
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
          color: theme.vars.palette.primary.main,
          '&:hover': {
            color: theme.vars.palette.primary.dark
          },
          fontFamily: defaultFont
        })
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
});

export default responsiveFontSizes(extendedTheme) as typeof extendedTheme;
