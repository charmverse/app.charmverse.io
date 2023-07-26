import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack } from '@mui/material';
import { useState, type ReactNode } from 'react';

import { StyledBanner } from 'components/common/Banners/Banner';
import { Button } from 'components/common/Button';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export function AnnouncementBanner({
  children,
  hideClose,
  errorBackground
}: {
  children: ReactNode;
  hideClose?: boolean;
  errorBackground?: boolean;
}) {
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(true);
  const { onClick } = useSettingsDialog();

  if (!showAnnouncementBar) {
    return null;
  }

  return (
    <StyledBanner errorBackground={errorBackground} top={20} data-test='subscription-banner'>
      <Box pr={3} display='flex' alignItems='center'>
        {children}
        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <Button
            endIcon={<EastIcon />}
            sx={{ ml: 1, pb: 0, pt: 0, fontWeight: 600 }}
            color={errorBackground ? 'white' : 'primary'}
            onClick={() => onClick('subscription')}
            variant='outlined'
          >
            UPGRADE
          </Button>
        </Stack>
      </Box>
      {!hideClose && (
        <IconButton
          onClick={() => setShowAnnouncementBar(false)}
          size='small'
          sx={{
            position: 'absolute',
            right: 5,
            top: 8
          }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      )}
    </StyledBanner>
  );
}
