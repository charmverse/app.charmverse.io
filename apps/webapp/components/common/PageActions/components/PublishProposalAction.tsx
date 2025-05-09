import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { RiDraftLine } from 'react-icons/ri';

import { useGoBackToStep, usePublishProposal } from 'charmClient/hooks/proposals';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';

export function PublishProposalAction({ proposalId }: { proposalId: string }) {
  const { showConfirmation } = useConfirmationModal();
  const { trigger: publishProposal } = usePublishProposal({ proposalId });
  const { trigger: goBackToStep } = useGoBackToStep({ proposalId });
  const { proposal } = useProposal({
    proposalId
  });
  const { showError } = useSnackbar();

  const label = proposal?.status === 'published' ? 'Unpublish' : 'Publish';

  const disabledTooltip = !proposal?.permissions?.move
    ? `You cannot ${label.toLowerCase()} this proposal`
    : proposal?.archived
      ? 'You cannot move an archived proposal'
      : '';

  async function onClick() {
    if (disabledTooltip) {
      return;
    }
    try {
      if (proposal?.status === 'published') {
        if (proposal.evaluations.some((e) => e.result)) {
          const { confirmed } = await showConfirmation(
            'Unpublishing a proposal will clear evaluation results. Are you sure you want to continue?'
          );
          if (!confirmed) {
            return;
          }
        }
        await goBackToStep({ evaluationId: 'draft' });
      } else {
        await publishProposal();
      }
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Tooltip title={disabledTooltip} disableInteractive>
      <div>
        <MenuItem data-test='context-menu-publish-proposal' disabled={!!disabledTooltip} onClick={onClick}>
          <ListItemIcon>
            <RiDraftLine />
          </ListItemIcon>
          <ListItemText primary={`${label}`} />
        </MenuItem>
      </div>
    </Tooltip>
  );
}
