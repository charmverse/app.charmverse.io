import type { Theme } from '@mui/material';
import { useMediaQuery } from '@mui/material';

import { MenuItems } from 'components/common/MenuItems';

export function HeaderMenu() {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return isMobile ? null : <MenuItems transparent={true} />;
}
