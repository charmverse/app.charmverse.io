import { useTheme } from '@emotion/react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { getTimeDifference } from 'lib/utilities/dates';

import { BlocksExplanationModal } from './BlocksExplanation';
import { useBlockCount } from './hooks/useBlockCount';
import { useSpaceSubscription } from './hooks/useSpaceSubscription';
import { UpgradeChip } from './UpgradeWrapper';

/**
 * In future, we may bring back a version of block counts with a modal.
 * You can retrive this with commit f37a085ef095cb70916a7f142086077af0b0d33f
 * @returns
 */
export function BlockCounts() {
  const theme = useTheme();
  const { spaceSubscription } = useSpaceSubscription();
  const { blockCount } = useBlockCount();

  const {
    isOpen: isExplanationModalOpen,
    close: closeExplanationModal,
    open: openExplanationModal
  } = usePopupState({ variant: 'popover', popupId: 'block-count-info' });

  if (!blockCount) {
    return null;
  }

  const blockQuota = (spaceSubscription?.blockQuota || 0) * 1000;
  const passedBlockQuota = blockCount.count > blockQuota;

  return (
    <Box width='100%' display='block' justifyContent='space-between' alignItems='center'>
      {passedBlockQuota && <UpgradeChip forceDisplay />}
      <Typography
        variant='caption'
        display='flex'
        sx={{
          width: '100%',
          whiteSpace: 'break-spaces'
        }}
      >
        Current block usage:{' '}
        <Typography variant='caption' color={passedBlockQuota ? 'error' : undefined}>
          {blockCount.count.toLocaleString()}
        </Typography>
        /{blockQuota.toLocaleString()}
        <HelpOutlineIcon
          onClick={openExplanationModal}
          color={theme.palette.background.default as any}
          fontSize='small'
          sx={{ ml: 1, cursor: 'pointer' }}
        />
      </Typography>
      {spaceSubscription?.status === 'free_trial' && spaceSubscription.expiresOn && (
        <Typography
          variant='caption'
          color='secondary'
          sx={{
            display: 'inline-flex',
            width: '100%',
            whiteSpace: 'break-spaces'
          }}
        >
          Free trial: Community Edition - {getTimeDifference(new Date(spaceSubscription.expiresOn), 'day')} days left
        </Typography>
      )}

      <BlocksExplanationModal open={isExplanationModalOpen} onClose={closeExplanationModal} />
    </Box>
  );
}
