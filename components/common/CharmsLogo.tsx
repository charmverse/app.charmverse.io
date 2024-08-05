import type { SvgIconOwnProps } from '@mui/material';
import { SvgIcon } from '@mui/material';

import CharmsLogoSvg from 'public/images/charm.svg';

export function CharmsLogo({ size = 20, color = 'inherit' }: { size?: number; color?: SvgIconOwnProps['color'] }) {
  return <SvgIcon component={CharmsLogoSvg} sx={{ height: size, width: size }} inheritViewBox color={color} />;
}
