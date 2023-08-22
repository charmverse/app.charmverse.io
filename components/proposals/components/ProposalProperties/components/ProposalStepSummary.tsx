import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { ArrowBackIos } from '@mui/icons-material';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { Stack, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import {
  proposalStatusDetails,
  getProposalStatuses,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

type Props = {
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalStatus?: ProposalWithUsers['status'];
  openVoteModal?: () => void;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
  archived?: boolean | null;
  evaluationType?: ProposalEvaluationType;
};

export function ProposalStepSummary({
  proposalStatus,
  proposalFlowFlags,
  openVoteModal,
  updateProposalStatus,
  archived,
  evaluationType
}: Props) {
  const statuses = getProposalStatuses(evaluationType);
  const currentStatusIndex = proposalStatus ? statuses.indexOf(proposalStatus) : -1;
  const nextStatus = statuses[currentStatusIndex + 1];
  const previousStatus = statuses[currentStatusIndex - 1];
  const previousConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'previous-proposal-status-change-confirmation'
  });
  const nextConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'next-proposal-status-change-confirmation'
  });

  function handleProposalStatusUpdate(newStatus: ProposalStatus) {
    switch (newStatus) {
      case 'draft':
      case 'discussion':
      case 'review':
      case 'vote_active':
      case 'reviewed':
        if (newStatus === previousStatus) {
          previousConfirmationPopup.open();
        } else if (newStatus === nextStatus) {
          nextConfirmationPopup.open();
        }
        break;
      default:
        updateProposalStatus?.(newStatus);
        break;
    }
  }

  function previousProposalStatusUpdateMessage(status: ProposalStatus) {
    switch (status) {
      case 'draft':
        return 'In the Draft stage, only authors and administrators can view and edit the proposal.';
      case 'discussion':
        return 'Rejecting this proposal will return it to the Discussion stage for further consideration.';
      default:
        return null;
    }
  }

  function nextProposalStatusUpdateMessage(status: ProposalStatus) {
    switch (status) {
      case 'discussion':
        return 'In the Feedback stage, all Members can view and provide feedback on the proposal.';
      case 'review':
        return 'In the Review stage, the Proposal is visible to all organization members, but disables feedback. Reviewer approval is required to proceed to the voting stage.';
      case 'vote_active':
        return 'Proceeding with this action will transition the proposal into the Voting stage.';
      case 'reviewed':
        return 'By approving this proposal, you authorize its advancement to the voting stage, to be initiated by an author.';
      default:
        return null;
    }
  }

  const previousConfirmationMessage = previousProposalStatusUpdateMessage(previousStatus);
  const nextConfirmationMessage = nextProposalStatusUpdateMessage(nextStatus);

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
            {proposalStatus ? PROPOSAL_STATUS_LABELS[proposalStatus] : '-'}
            {archived ? <Chip sx={{ ml: 1 }} label='Archived' size='small' color='blue' /> : ''}
          </Typography>
          <Typography color='secondary' variant='body1'>
            {proposalStatus ? proposalStatusDetails[proposalStatus] : '-'}
          </Typography>
        </Stack>

        <Stack gap={0.5} direction='row' fontSize='10px'>
          {!!previousStatus && (
            <>
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
              <ModalWithButtons
                open={previousConfirmationPopup.isOpen && !!previousConfirmationMessage}
                buttonText='Continue'
                onClose={previousConfirmationPopup.close}
                onConfirm={() => updateProposalStatus?.(previousStatus)}
              >
                <Typography>{previousConfirmationMessage}</Typography>
              </ModalWithButtons>
            </>
          )}
          {!!nextStatus && (
            <>
              <Button
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
              <ModalWithButtons
                open={nextConfirmationPopup.isOpen && !!nextConfirmationMessage}
                onClose={nextConfirmationPopup.close}
                buttonText='Continue'
                onConfirm={() => {
                  if (nextStatus === 'vote_active') {
                    openVoteModal?.();
                  } else {
                    updateProposalStatus?.(nextStatus);
                  }
                }}
              >
                <Typography>{nextConfirmationMessage}</Typography>
              </ModalWithButtons>
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
