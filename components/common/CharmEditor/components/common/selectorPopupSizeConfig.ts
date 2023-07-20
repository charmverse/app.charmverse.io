import type { SxProps } from '@mui/material';

export const width = { xs: '90vw', md: 500, lg: 750 };

// This is consumed by popup widgets in charm editor such as pdf or file selector to provide sufficient width
export const selectorPopupSizeConfig: SxProps = {
  width
};
