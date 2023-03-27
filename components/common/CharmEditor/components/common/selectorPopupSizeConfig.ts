import type { Theme } from '@mui/material';
import type { SxProps } from '@mui/system';

// This is consumed by popup widgets in charm editor such as pdf or file selector to provide sufficient width
export const selectorPopupSizeConfig: SxProps<Theme> = {
  width: { xs: '90vw', md: 500, lg: 750 }
};
