import { log } from '@charmverse/core/log';
import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

// props based on https://mui.com/material-ui/api/hidden/
type Props = {
  mdDown?: boolean;
  mdUp?: boolean;
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'table' | 'table-cell';
} & BoxProps;

// TODO: just use class names?
export function getSXProps({ display = 'block', mdDown, mdUp }: Props) {
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
export function Hidden({ children, mdDown, mdUp, ...restProps }: PropsWithChildren<Props>) {
  return (
    <Box sx={getSXProps({ mdDown, mdUp })} {...restProps}>
      {children}
    </Box>
  );
}
