import { Box } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { SiteNavigation } from '@packages/scoutgame-ui/components/common/Navigation/SiteNavigation';

export function StickyFooter() {
  return (
    <Box component='footer' position='sticky' bottom={0} width='100%'>
      <Hidden mdUp>
        <SiteNavigation />
      </Hidden>
    </Box>
  );
}
