import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack, Typography } from '@mui/material';

import { StyledBanner } from 'components/common/Banners/Banner';
import Button from 'components/common/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

const UpgradeButton = styled(Button)`
  font-weight: 600;
  padding-bottom: 0;
  padding-top: 0;
`;

// save this for a little while in case we need to show something to trialing accounts
export function PaidAnnouncementBanner({ spaceId }: { spaceId: string }) {
  const [showPaidAnnouncementBar, setShowPaidAnnouncementBar] = useLocalStorage(`show-paid-banner/${spaceId}`, true);
  const { onClick } = useSettingsDialog();

  return showPaidAnnouncementBar ? (
    <StyledBanner top={20} data-test='paid-announcement-banner'>
      <Box pr={3} display='flex'>
        <Typography component='div'>Community Edition available. Upgrade now!</Typography>
        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <UpgradeButton
            endIcon={<EastIcon />}
            sx={{ ml: 1 }}
            color='primary'
            onClick={() => onClick('subscription')}
            variant='outlined'
          >
            UPGRADE
          </UpgradeButton>
        </Stack>
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
