import type {
  PaletteOptions as MuiPaletteOptions,
  PaletteColorOptions as MuiPaletteColorOptions,
  PaletteColor
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface PaletteOptions extends MuiPaletteOptions {
    textPrimary: MuiPaletteOptions['primary'];
  }
  export interface Palette extends MuiPaletteColorOptions {
    textPrimary: PaletteColor;
  }
}
