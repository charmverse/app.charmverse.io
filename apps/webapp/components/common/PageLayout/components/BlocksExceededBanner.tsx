import { log } from '@charmverse/core/log';
import EastIcon from '@mui/icons-material/East';
import { Box, Stack, Typography } from '@mui/material';

import { StyledBanner } from 'components/common/Banners/Banner';
import { Button } from 'components/common/Button';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';

export function BlocksExceededBanner() {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { spaceBlockQuota, spaceBlockCount, hasPassedBlockQuota, isSpaceReadonly } = useSpaceSubscription();
  const { openSettings } = useSettingsDialog();
  const showUpgradeBanner = !!user && hasPassedBlockQuota && space?.paidTier !== 'enterprise';

  if (!showUpgradeBanner) {
    return null;
  }

  log.warn('Show blocks exceeded banner', { spaceBlockQuota, spaceBlockCount, spaceId: space?.id });

  return (
    <StyledBanner errorBackground top={20} data-test='subscription-banner'>
      <Box pr={3} display='flex' alignItems='center'>
        {isSpaceReadonly ? (
          <Typography>This space subscription has expired</Typography>
        ) : (
          <Typography>This space has passed the block limit of {spaceBlockQuota.toLocaleString()}</Typography>
        )}

        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <Button
            endIcon={<EastIcon />}
            sx={{ ml: 1, pb: 0, pt: 0, fontWeight: 600 }}
            color='white'
            onClick={() => openSettings('subscription')}
            variant='outlined'
          >
            UPGRADE
          </Button>
        </Stack>
      </Box>
    </StyledBanner>
  );
}
