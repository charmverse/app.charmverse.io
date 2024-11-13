import type {
  PaletteOptions as MuiPaletteOptions,
  PaletteColorOptions as MuiPaletteColorOptions,
  Palette as MuiPalette,
  PaletteColor as MuiPaletteColor,
  BreakpointsOptions as MuiBreakpointsOptions,
  BreakpointOverrides as MuiBreakpointOverrides,
  TypeText,
  PaletteTextChannel
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface Palette extends MuiPalette {
    inputBackground: MuiPalette['primary'];
    black: MuiPalette['primary'];
    orange: MuiPalette['primary'];
    green: MuiPalette['primary'];
  }

  export interface PaletteOptions extends MuiPaletteOptions {
    inputBackground: MuiPaletteOptions['primary'];
    black: MuiPaletteOptions['primary'];
    orange: MuiPaletteOptions['primary'];
    green: MuiPaletteOptions['primary'];
  }

  export interface TypeBackground extends MuiTypeBackground {
    default: string;
    paper: string;
    dark: string;
    light: string;
  }

  export interface BreakpointOverrides extends MuiBreakpointOverrides {
    xsm: true;
  }

  export interface BreakpointsOptions extends MuiBreakpointsOptions {
    xsm: number; // adds the `xsm` breakpoint
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    buy: true;
  }
}
