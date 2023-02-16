import { ArrowBackIos } from '@mui/icons-material';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { Stack, Typography, Button } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';

import { canChangeProposalStatus } from 'lib/proposal/canChangeProposalStatus';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import {
  proposalStatusDetails,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

type Props = {
  proposalUserGroups: ProposalUserGroup[];
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
};

export function ProposalStepSummary({ proposal, proposalUserGroups, openVoteModal, updateProposalStatus }: Props) {
  const currentStatus = proposal?.status;
  const currentStatusIndex = currentStatus ? PROPOSAL_STATUSES.indexOf(currentStatus) : -1;
  const hasNext = currentStatusIndex < PROPOSAL_STATUSES.length - 1;
  const hasPrev = currentStatusIndex > 0;
  const showActions = proposalUserGroups.length > 0;

  const nextStatus = hasNext ? PROPOSAL_STATUSES[currentStatusIndex + 1] : null;
  let prevStatus = hasPrev ? PROPOSAL_STATUSES[currentStatusIndex - 1] : null;
  if (prevStatus === 'review') {
    prevStatus = 'discussion';
  }

  const nextEnabled = nextStatus
    ? canChangeProposalStatus({ proposal, updatedStatus: nextStatus, proposalUserGroups })
    : false;
  const backEnabled = prevStatus
    ? canChangeProposalStatus({ proposal, updatedStatus: prevStatus, proposalUserGroups })
    : false;

  return (
    <Stack flex={1}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
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
            <Button
              sx={{ whiteSpace: 'nowrap', flex: 1 }}
              size='small'
              color='secondary'
              startIcon={<ArrowBackIos fontSize='inherit' />}
              disabled={!backEnabled}
              onClick={() => {
                if (prevStatus) {
                  updateProposalStatus(prevStatus);
                }
              }}
            >
              {prevStatus ? `${PROPOSAL_STATUS_LABELS[prevStatus]}` : 'Back'}
            </Button>
            <Button
              size='small'
              color='primary'
              sx={{ whiteSpace: 'nowrap', flex: 1 }}
              endIcon={<ArrowForwardIos fontSize='inherit' />}
              disabled={!nextEnabled}
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
              {nextStatus ? `${PROPOSAL_STATUS_LABELS[nextStatus]}` : 'Next'}
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
