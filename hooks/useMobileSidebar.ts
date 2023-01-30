import { useTheme } from '@emotion/react';
import { useMediaQuery } from '@mui/material';

export function useMobileSidebar() {
  const theme = useTheme();
  const isMobileSidebar = useMediaQuery(theme.breakpoints.down('md'));

  return isMobileSidebar;
}
