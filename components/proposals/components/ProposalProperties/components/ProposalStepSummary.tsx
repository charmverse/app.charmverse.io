import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { ArrowBackIos, Create } from '@mui/icons-material';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { Stack, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';

import { Button } from 'components/common/Button';
import { CreateProposalRewardsButton } from 'components/proposals/components/ProposalRewards/CreateProposalRewardsButton';
import {
  proposalStatusDetails,
  getProposalStatuses,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

type Props = {
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalStatus?: ProposalWithUsers['status'];
  handleProposalStatusUpdate: (newStatus: ProposalStatus) => Promise<void>;
  archived?: boolean | null;
  evaluationType?: ProposalEvaluationType;
  canCreateRewards?: boolean;
  proposalId?: string;
};

export function ProposalStepSummary({
  proposalStatus,
  proposalFlowFlags,
  handleProposalStatusUpdate,
  archived,
  evaluationType,
  canCreateRewards,
  proposalId
}: Props) {
  const statuses = getProposalStatuses(evaluationType);
  const currentStatusIndex = proposalStatus ? statuses.indexOf(proposalStatus) : -1;
  const nextStatus = statuses[currentStatusIndex + 1];
  const previousStatus = statuses[currentStatusIndex - 1];

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
          <Typography variant='h5' fontWeight='bold' data-test='current-proposal-status'>
            {proposalStatus ? PROPOSAL_STATUS_LABELS[proposalStatus] : <>&nbsp;</>}
            {archived ? <Chip sx={{ ml: 1 }} label='Archived' size='small' color='blue' /> : ''}
          </Typography>
          <Typography color='secondary' variant='body1'>
            {proposalStatus ? proposalStatusDetails[proposalStatus] : <>&nbsp;</>}
          </Typography>
        </Stack>

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
              onClick={() => handleProposalStatusUpdate(previousStatus)}
            >
              {PROPOSAL_STATUS_LABELS[previousStatus]}
            </Button>
          )}
          {!!nextStatus && (
            <Button
              data-test='next-status-button'
              disabledTooltip={nextStatus === 'discussion' ? 'Select a reviewer to proceed' : undefined}
              size='small'
              color='primary'
              disableElevation
              sx={{ whiteSpace: 'nowrap' }}
              endIcon={<ArrowForwardIos fontSize='inherit' />}
              disabled={!proposalFlowFlags?.[nextStatus]}
              onClick={() => handleProposalStatusUpdate(nextStatus)}
            >
              {PROPOSAL_STATUS_LABELS[nextStatus]}
            </Button>
          )}
          {!nextStatus && canCreateRewards && proposalId && <CreateProposalRewardsButton proposalId={proposalId} />}
        </Stack>
      </Stack>
    </Stack>
  );
}
