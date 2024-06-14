'use client';

import type {} from '@mui/material/themeCssVarsAugmentation';
import { darken, experimental_extendTheme as extendTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

import {
  backgroundColor,
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  blueColor,
  darkBlueColor,
  inputBackground,
  inputBackgroundDarkMode,
  inputBorder,
  inputBorderDarkMode,
  primaryTextColor,
  primaryTextColorDarkMode,
  secondaryTextColor,
  secondaryTextColorDarkMode
} from './colors';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap'
});

const extendedTheme = extendTheme({
  cssVarPrefix: 'charm',
  typography: {
    fontFamily: roboto.style.fontFamily
  },
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
        }
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
        },
        text: () => ({
          '&:hover': {
            backgroundColor: inputBackground
          },
          '[data-mui-color-scheme="dark"] &': {
            '&:hover': {
              backgroundColor: inputBackgroundDarkMode
            }
          }
        })
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: () => ({
          '&:hover': {
            backgroundColor: inputBackground
          },
          '[data-mui-color-scheme="dark"] &': {
            '&:hover': {
              backgroundColor: inputBackgroundDarkMode
            }
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
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 1000,
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
        root: ({ theme }) => ({
          backgroundColor: inputBackground,
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: inputBorder
          },
          '[data-mui-color-scheme="dark"] &': {
            backgroundColor: inputBackgroundDarkMode,
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderDarkMode
            }
          }
        }),
        notchedOutline: ({ theme }) => ({
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
          color: theme.vars.palette.primary.main,
          '&:hover': {
            color: theme.vars.palette.primary.dark
          }
        })
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
});

export default extendedTheme;
