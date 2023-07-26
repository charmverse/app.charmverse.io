import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { Box, IconButton, Stack } from '@mui/material';
import type { ReactNode } from 'react';

import { StyledBanner } from 'components/common/Banners/Banner';
import Button from 'components/common/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

const UpgradeButton = styled(Button)`
  font-weight: 600;
  padding-bottom: 0;
  padding-top: 0;
`;

export function AnnouncementBanner({
  spaceId,
  children,
  showClose = true,
  errorBackground = false
}: {
  spaceId: string;
  children: ReactNode;
  showClose?: boolean;
  errorBackground?: boolean;
}) {
  const [showAnnouncementBar, setShowAnnouncementBar] = useLocalStorage(`show-paid-banner/${spaceId}`, true);
  const { onClick } = useSettingsDialog();

  return showAnnouncementBar ? (
    <StyledBanner errorBackground={errorBackground} top={20} data-test='subscription-banner'>
      <Box pr={3} display='flex' alignItems='center'>
        {children}
        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <UpgradeButton
            endIcon={<EastIcon />}
            sx={{ ml: 1 }}
            color={errorBackground ? 'white' : 'primary'}
            onClick={() => onClick('subscription')}
            variant='outlined'
          >
            UPGRADE
          </UpgradeButton>
        </Stack>
      </Box>
      {showClose && (
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
  ) : null;
}
