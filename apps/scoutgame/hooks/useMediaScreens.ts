import type { Theme } from '@mui/material';
import { useMediaQuery } from '@mui/material';

export function useLgScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
}

export function useMdScreen() {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
}
