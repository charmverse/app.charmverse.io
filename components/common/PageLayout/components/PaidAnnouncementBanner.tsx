import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack, Typography } from '@mui/material';

import { StyledBanner } from 'components/common/Banners/Banner';
import Button from 'components/common/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export function PaidAnnouncementBanner() {
  const [showPaidAnnouncementBar, setShowPaidAnnouncementBar] = useLocalStorage('show-paid-banner', true);
  const { onClick } = useSettingsDialog();

  return showPaidAnnouncementBar ? (
    <StyledBanner top={20} data-test='paid-announcement-banner'>
      <Box pr={3}>
        <Typography component='div'>
          Community Edition available. Upgrade NOW using code <b>"charmed"</b> for 40% off for the 1st year.{' '}
          <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
            <Button
              color='inherit'
              onClick={() => onClick('subscription')}
              variant='text'
              sx={{
                fontSize: 15,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              UPGRADE
              <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16, ml: 1 }} />
            </Button>
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
