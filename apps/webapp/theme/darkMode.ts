import type { PaletteMode } from '@mui/material';

export function setDarkMode(darkMode: boolean) {
  const currentTheme: PaletteMode = darkMode ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
}
export function getDarkMode(): PaletteMode {
  if (typeof document !== 'undefined') {
    return (document.documentElement.getAttribute('data-theme') as PaletteMode) || 'light';
  }
  return 'light';
}
