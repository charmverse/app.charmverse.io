import type { ProposalStatus } from '@charmverse/core/dist/prisma';
import { ArrowBackIos } from '@mui/icons-material';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { Button, Stack, Typography } from '@mui/material';

import type { ProposalFlowFlags } from 'lib/proposal/computeProposalFlowFlags';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import {
  proposalStatusDetails,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

type Props = {
  proposalFlowFlags?: ProposalFlowFlags;
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
};

export function ProposalStepSummary({ proposal, proposalFlowFlags, openVoteModal, updateProposalStatus }: Props) {
  const currentStatus = proposal?.status;
  const currentStatusIndex = currentStatus ? PROPOSAL_STATUSES.indexOf(currentStatus) : -1;
  const nextStatus = PROPOSAL_STATUSES[currentStatusIndex + 1];
  const previousStatus = PROPOSAL_STATUSES[currentStatusIndex - 1];

  const showActions =
    (nextStatus && proposalFlowFlags?.[nextStatus]) || (previousStatus && proposalFlowFlags?.[previousStatus]);
  return (
    <Stack flex={1}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'flex-start' }}
        justifyContent='space-between'
        flex={1}
        gap={1}
      >
        <Stack gap={0.5}>
          <Typography variant='h5' fontWeight='bold'>
            {currentStatus ? PROPOSAL_STATUS_LABELS[currentStatus] : '-'}
          </Typography>
          <Typography color='secondary' variant='body1'>
            {currentStatus ? proposalStatusDetails[currentStatus] : '-'}
          </Typography>
        </Stack>

        {showActions && (
          <Stack gap={0.5} direction='row' fontSize='10px'>
            {!!previousStatus && (
              <Button
                sx={{ whiteSpace: 'nowrap' }}
                size='small'
                color='secondary'
                startIcon={<ArrowBackIos fontSize='inherit' />}
                disabled={!proposalFlowFlags?.[previousStatus]}
                disableElevation
                variant='outlined'
                onClick={() => {
                  if (previousStatus) {
                    updateProposalStatus(previousStatus);
                  }
                }}
              >
                {PROPOSAL_STATUS_LABELS[previousStatus]}
              </Button>
            )}
            {!!nextStatus && (
              <Button
                size='small'
                color='primary'
                disableElevation
                sx={{ whiteSpace: 'nowrap' }}
                endIcon={<ArrowForwardIos fontSize='inherit' />}
                disabled={!proposalFlowFlags?.[nextStatus]}
                onClick={() => {
                  if (nextStatus) {
                    if (nextStatus === 'vote_active') {
                      openVoteModal();
                    } else {
                      updateProposalStatus(nextStatus);
                    }
                  }
                }}
              >
                {PROPOSAL_STATUS_LABELS[nextStatus]}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
