import { Box } from '@mui/material';

import { Hidden } from 'components/common/Hidden';
import { SiteNavigation } from 'components/common/SiteNavigation';

export function StickyFooter({ isAuthenticated }: { isAuthenticated?: boolean }) {
  return (
    <Box component='footer' position='sticky' bottom={0}>
      <Hidden mdUp>
        <SiteNavigation isAuthenticated={isAuthenticated} />
      </Hidden>
    </Box>
  );
}
