import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { IconButton, Stack, Typography } from '@mui/material';

import Link from 'components/common/Link';
import { useLocalStorage } from 'hooks/useLocalStorage';

import { StyledBanner } from './Banner';

export function PaidAnnouncementBanner() {
  const [showPaidAnnouncementBar, setShowPaidAnnouncementBar] = useLocalStorage('show-paid-banner', true);
  return showPaidAnnouncementBar ? (
    <StyledBanner top={50} data-test='paid-announcement-banner'>
      <Typography component='div'>
        Community Edition coming on June 30th. Includes complex role-based access control, API, & custom domain.{' '}
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
  ) : null;
}
