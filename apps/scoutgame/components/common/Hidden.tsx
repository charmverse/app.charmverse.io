import { log } from '@charmverse/core/log';
import { Box } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/types';
// replace a deprecated Hidden component

// props based on https://mui.com/material-ui/api/hidden/
type Props = {
  mdDown?: boolean;
  mdUp?: boolean;
};

export function Hidden({ children, mdDown, mdUp }: PropsWithChildren<Props>) {
  if (mdDown) {
    return <Box sx={{ display: { xs: 'none', md: 'block' } }}>{children}</Box>;
  }
  if (mdUp) {
    return <Box sx={{ display: { xs: 'block', md: 'none' } }}>{children}</Box>;
  }
  log.warn('Hidden component must have either mdDown or mdUp prop');
  return <Box>{children}</Box>;
}
