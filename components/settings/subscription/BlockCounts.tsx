import { useTheme } from '@emotion/react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { BlocksExplanationModal } from './BlocksExplanation';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { UpgradeChip } from './UpgradeWrapper';

/**
 * In future, we may bring back a version of block counts with a modal.
 * You can retrive this with commit f37a085ef095cb70916a7f142086077af0b0d33f
 * @returns
 */
export function BlockCounts() {
  const theme = useTheme();
  const { spaceBlockQuota, spaceBlockCount, hasPassedBlockQuota } = useSpaceSubscription();

  const {
    isOpen: isExplanationModalOpen,
    close: closeExplanationModal,
    open: openExplanationModal
  } = usePopupState({ variant: 'popover', popupId: 'block-count-info' });

  if (!spaceBlockCount) {
    return null;
  }

  return (
    <Box width='100%' display='block' justifyContent='space-between' alignItems='center'>
      {hasPassedBlockQuota && <UpgradeChip forceDisplay />}
      <Typography
        variant='caption'
        display='flex'
        sx={{
          width: '100%',
          whiteSpace: 'break-spaces'
        }}
      >
        Current block usage:{' '}
        <Typography variant='caption' color={hasPassedBlockQuota ? 'error' : undefined}>
          {spaceBlockCount.toLocaleString()}
        </Typography>
        {!!spaceBlockQuota && `/${spaceBlockQuota.toLocaleString()}`}
        <HelpOutlineIcon
          onClick={openExplanationModal}
          color={theme.palette.background.default as any}
          fontSize='small'
          sx={{ ml: 1, cursor: 'pointer' }}
        />
      </Typography>

      <BlocksExplanationModal open={isExplanationModalOpen} onClose={closeExplanationModal} />
    </Box>
  );
}
