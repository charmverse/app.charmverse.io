import { useTheme } from '@emotion/react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getTimeDifference } from 'lib/utilities/dates';

import { useSpaceSubscription } from '../hooks/useSpaceSubscription';

import { BlocksExplanationModal } from './BlocksExplanation';

/**
 * In future, we may bring back a version of block counts with a modal.
 * You can retrive this with commit f37a085ef095cb70916a7f142086077af0b0d33f
 * @returns
 */
export function BlockCounts() {
  const { space: currentSpace } = useCurrentSpace();
  const theme = useTheme();

  const { spaceSubscription } = useSpaceSubscription();
  const {
    isOpen: isExplanationModalOpen,
    close: closeExplanationModal,
    open: openExplanationModal
  } = usePopupState({ variant: 'popover', popupId: 'block-count-info' });

  const { data: blockCount } = useSWR(currentSpace ? `space-block-count-${currentSpace.id}` : null, () =>
    charmClient.spaces.getBlockCount({
      spaceId: currentSpace!.id
    })
  );

  if (!blockCount) {
    return null;
  }
  return (
    <Box width='100%' display='block' justifyContent='space-between' alignItems='center'>
      <Typography
        variant='caption'
        display='flex'
        sx={{
          width: '100%',
          whiteSpace: 'break-spaces'
        }}
      >
        Current block usage: {`${blockCount.count.toLocaleString()}`}
        <HelpOutlineIcon
          onClick={openExplanationModal}
          color={theme.palette.background.default as any}
          fontSize='small'
          sx={{
            ml: 1,
            cursor: 'pointer'
          }}
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
