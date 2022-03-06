import { PaletteMode, Theme as MaterialUITheme } from '@mui/material';

export function setTheme (mode: PaletteMode, theme: MaterialUITheme) {
  const colors = theme.palette;
  document.documentElement.style.setProperty('--charm-lit-color-white', colors.background.paper);
  document.documentElement.style.setProperty('--charm-lit-color-light', colors.background.dark);
  document.documentElement.style.setProperty('--charm-lit-brand-2', colors.secondary.light);
  document.documentElement.style.setProperty('--charm-lit-brand-4', colors.text.secondary);
  document.documentElement.style.setProperty('--charm-lit-primary', colors.primary.main);
  document.documentElement.style.setProperty('--charm-lit-color-gray', colors.secondary.light);
  document.documentElement.style.setProperty('--charm-button-filter', mode === 'dark' ? 'invert(70%)' : '');
}
