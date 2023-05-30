import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Typography, Stack, IconButton } from '@mui/material';
import { useEffect, useState } from 'react';

import Link from 'components/common/Link';
import { useLocalStorage } from 'hooks/useLocalStorage';

import { StyledBanner } from './Banner';

export function PaidAnnouncementBanner() {
  const [showPaidAnnouncementBar, setShowPaidAnnouncementBar] = useLocalStorage('show-paid-banner', true);
  const [component, setComponent] = useState<JSX.Element | null>(null);
  // Using use-effect to render the component only client side, otherwise next.js throws rehydration mismatch error
  useEffect(() => {
    setComponent(
      showPaidAnnouncementBar ? (
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
          <IconButton
            onClick={() => setShowPaidAnnouncementBar(false)}
            size='small'
            sx={{
              position: 'absolute',
              right: 5
            }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </StyledBanner>
      ) : null
    );
  }, [showPaidAnnouncementBar, setShowPaidAnnouncementBar]);

  return component;
}
