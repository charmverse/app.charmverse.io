import { createTheme } from '@mui/material/styles';
import { Theme as MaterialUITheme } from '@mui/material';
import { darken } from '@mui/system';
import { darkBlueColor } from './colors';

// Re-declare the emotion theme to have the properties of the MaterialUiTheme - https://emotion.sh/docs/typescript#define-a-theme
declare module '@emotion/react' {
  export interface Theme extends MaterialUITheme {}
}

// define custom colors: https://material-ui.com/customization/palette/
declare module '@mui/material/styles/createPalette' {
  interface Palette {
    blue: Palette['primary'];
    facebook: Palette['primary'];
    twitter: Palette['primary'];
    white: PaletteOptions['primary'];
  }
  interface PaletteOptions {
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
const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
    background: {
      default: "#fafafa"
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
      main: '#010101',
    },
    secondary: {
      main: '#777',
    },
    blue: {
      main: '#00aced'
    },
    white: {
      main: '#eee'
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

export { theme };