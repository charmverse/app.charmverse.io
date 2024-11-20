import { Box } from '@mui/material';

import { SiteNavigation } from 'components/common/SiteNavigation';

export function StickyFooter() {
  return (
    <Box component='footer' position='sticky' bottom={0} zIndex={1000} width='100%'>
      <SiteNavigation />
    </Box>
  );
}
