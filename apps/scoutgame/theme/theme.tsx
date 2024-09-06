'use client';

import { experimental_extendTheme as extendTheme, responsiveFontSizes } from '@mui/material/styles';
import { Inter } from 'next/font/google';

import {
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  brandColor,
  disabledTextColorDarkMode,
  inputBackgroundDarkMode,
  inputBorderDarkMode,
  primaryTextColorDarkMode,
  purpleDisabled,
  secondaryText,
  secondaryLightText
} from './colors';

export const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const extendedTheme = extendTheme({
  cssVarPrefix: 'waitlist',
  typography: {
    fontFamily: interFont.style.fontFamily,
    button: {
      fontWeight: 600,
      fontSize: '1.2rem'
    }
  },
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
          primary: primaryTextColorDarkMode,
          secondary: secondaryText
        },
        primary: {
          main: brandColor,
          dark: purpleDisabled
        },
        secondary: {
          main: secondaryText,
          light: secondaryLightText
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
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '1rem',
          textTransform: 'none',
          paddingTop: '18px',
          paddingBottom: '18px'
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
              borderColor: inputBorderDarkMode
            }
          }
        }),
        notchedOutline: () => ({
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
          color: theme.vars.palette.primary.main,
          '&:hover': {
            color: theme.vars.palette.primary.dark
          },
          fontFamily: interFont.style.fontFamily
        })
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
});

export default responsiveFontSizes(extendedTheme) as typeof extendedTheme;
