import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack, Typography } from '@mui/material';

import { StyledBanner } from 'components/common/Banners/Banner';
import Link from 'components/common/Link';
import { useLocalStorage } from 'hooks/useLocalStorage';

export function PaidAnnouncementBanner() {
  const [showPaidAnnouncementBar, setShowPaidAnnouncementBar] = useLocalStorage('show-paid-banner', true);
  return showPaidAnnouncementBar ? (
    <StyledBanner top={20} data-test='paid-announcement-banner'>
      <Box pr={3}>
        <Typography component='div'>
          Community Edition coming on June 30th. Includes complex role-based access control, API, & custom domain.{' '}
          <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
            <Link
              color='inherit'
              target='_blank'
              href='https://app.charmverse.io/charmverse/page-5371612014886058'
              sx={{ fontWeight: 600 }}
            >
              More Details
            </Link>
            <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16 }} />
          </Stack>
        </Typography>
      </Box>
      <IconButton
        onClick={() => setShowPaidAnnouncementBar(false)}
        size='small'
        sx={{
          position: 'absolute',
          right: 5,
          top: 8
        }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </StyledBanner>
  ) : null;
}
