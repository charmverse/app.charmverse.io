import { Box } from '@mui/material';
import { log } from '@packages/core/log';
import type { ReactNode } from 'react';

// props based on https://mui.com/material-ui/api/hidden/
type Props = {
  children?: ReactNode;
  lgDown?: boolean;
  mdDown?: boolean;
  mdUp?: boolean;
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'table' | 'table-cell';
};

// TODO: just use class names?
export function getSXProps({ display = 'block', mdDown, mdUp, lgDown }: Props) {
  if (lgDown) {
    return { display: { xs: 'none', lg: display } };
  }
  if (mdDown) {
    return { display: { xs: 'none', md: display } };
  }
  if (mdUp) {
    return { display: { xs: display, md: 'none' } };
  }
  log.warn('Hidden component must have either mdDown or mdUp prop');
  return {};
}

// replace a deprecated Hidden component
export function Hidden({ children, display, lgDown, mdDown, mdUp }: Props) {
  return <Box sx={getSXProps({ display, lgDown, mdDown, mdUp })}>{children}</Box>;
}
