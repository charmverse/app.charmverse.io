import type {
  PaletteOptions as MuiPaletteOptions,
  PaletteColorOptions as MuiPaletteColorOptions,
  Palette as MuiPalette,
  PaletteColor as MuiPaletteColor,
  TypeText,
  PaletteTextChannel
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface Palette extends MuiPalette {
    inputBackground: MuiPalette['primary'];
    black: MuiPalette['primary'];
  }

  export interface PaletteOptions extends MuiPaletteOptions {
    inputBackground: MuiPaletteOptions['primary'];
    black: MuiPaletteOptions['primary'];
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    buy: true;
  }
}
