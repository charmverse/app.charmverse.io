import { Box } from '@mui/material';

import { Hidden } from 'components/common/Hidden';
import { SiteNavigation } from 'components/common/SiteNavigation';

export function StickyFooter() {
  return (
    <Box component='footer' position='sticky' bottom={0}>
      <Hidden mdUp>
        <SiteNavigation />
      </Hidden>
    </Box>
  );
}
