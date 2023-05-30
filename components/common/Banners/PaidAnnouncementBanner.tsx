import EastIcon from '@mui/icons-material/East';
import { Typography, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import Link from 'components/common/Link';

import { StyledBanner } from './Banner';

export function PaidAnnouncementBanner() {
  const [component, setComponent] = useState<JSX.Element | null>(null);
  // Using use-effect to render the component only client side, otherwise next.js throws rehydration mismatch error
  useEffect(() => {
    setComponent(
      <StyledBanner top={50} data-test='paid-announcement-banner'>
        <Typography>
          Community Edition coming on June 30th. Include complex role-based access control, API, & custom domain.{' '}
          <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
            <Link color='inherit' target='_blank' href='https://charmverse.io/pricing' sx={{ fontWeight: 600 }}>
              More Details
            </Link>
            <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16 }} />
          </Stack>
        </Typography>
      </StyledBanner>
    );
  }, []);

  return component;
}
