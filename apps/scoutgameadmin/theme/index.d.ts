import type {
  PaletteOptions as MuiPaletteOptions,
  PaletteColorOptions as MuiPaletteColorOptions,
  PaletteColor
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface PaletteOptions extends MuiPaletteOptions {
    textPrimary: MuiPaletteOptions['primary'];
    inputBackground: MuiPaletteOptions['primary'];
    footerBackground: MuiPaletteOptions['primary'];
    mainBackground: MuiPaletteOptions['primary'];
  }
  export interface Palette extends MuiPaletteColorOptions {
    textPrimary: PaletteColor;
    inputBackground: PaletteColor;
    footerBackground: PaletteColor;
    mainBackground: PaletteColor;
  }
}
