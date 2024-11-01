'use client';

import { grey } from '@mui/material/colors';
import { createTheme, alpha, darken, lighten, responsiveFontSizes } from '@mui/material/styles';
import { Inter } from 'next/font/google';

import {
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  brandColor,
  inputBackgroundDarkMode,
  inputBorderDarkMode,
  primaryTextColorDarkMode,
  secondaryTextColorDarkMode,
  primaryTextColor
} from './colors';

const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const contrastText = '#fff';

const themeOptions: Parameters<typeof createTheme>[0] = {
  typography: {
    fontFamily: interFont.style.fontFamily,
    button: {
      fontWeight: 600,
      fontSize: '1rem'
    }
  },
  shape: {
    borderRadius: 5
  },
  cssVariables: true,
  defaultColorScheme: 'dark',
  colorSchemes: {
    dark: {
      // palette for dark mode
      palette: {
        background: {
          default: backgroundColorDarkMode,
          paper: backgroundLightColorDarkMode
          // dark: darken(backgroundLightColorDarkMode, 0.25),
          // light: lighten(backgroundColorDarkMode, 0.125) // this # is based on the background needed for Info pages
        },
        text: {
          primary: primaryTextColorDarkMode,
          disabled: primaryTextColor
        },
        primary: {
          main: brandColor,
          dark: darken(brandColor, 0.2)
        },
        secondary: {
          contrastText,
          main: secondaryTextColorDarkMode
        },

        action: {
          focus: 'rgb(29, 92, 132)',
          hover: 'rgba(255, 255, 255, 0.055)',
          selected: 'rgba(255, 255, 255, 0.055)'
        },
        textPrimary: {
          main: primaryTextColorDarkMode
        },
        footerBackground: { main: grey[700] },
        mainBackground: { main: backgroundColorDarkMode },
        inputBackground: {
          main: inputBackgroundDarkMode
        }
      }
    }
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16 // Adjust this value to increase or decrease the roundness
        }
      }
    },
    MuiPopover: {
      defaultProps: {
        disableRestoreFocus: true
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary
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
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.default,
          boxShadow: 'none',
          paddingTop: 1,
          paddingBottom: 1
        })
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
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: brandColor
        }
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
    MuiToggleButton: {},
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
          textTransform: 'none'
        }
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
        disableRipple: true
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
          boxShadow: 'none'
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
    MuiSkeleton: {
      styleOverrides: {
        root: {
          transform: 'scale(1, 1)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: inputBackgroundDarkMode,
          ...theme.applyStyles('dark', {
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderDarkMode
            }
          })
        }),
        notchedOutline: ({ theme }) => ({
          ...theme.applyStyles('dark', {
            borderColor: inputBorderDarkMode
          })
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
    MuiTabs: {
      defaultProps: {
        TabIndicatorProps: {
          sx: (theme) => ({
            backgroundColor: theme.palette.text.secondary
          })
        }
      },
      styleOverrides: {
        root: {}
      }
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 0,
          textTransform: 'none',
          color: theme.palette.text.primary,
          fontWeight: '400',
          '&.Mui-selected': {
            color: theme.palette.text.secondary
          }
        })
      }
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.primary.main,
          '&:hover': {
            color: theme.palette.primary.dark
          },
          fontFamily: interFont.style.fontFamily
        })
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
};

const createdTheme = createTheme(themeOptions);

export default responsiveFontSizes(createdTheme) as typeof createdTheme;
