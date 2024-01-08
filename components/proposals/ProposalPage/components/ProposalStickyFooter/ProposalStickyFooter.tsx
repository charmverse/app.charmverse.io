import { Box } from '@mui/material';

import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { getProposalErrors } from '../../hooks/useNewProposal';

import { CompleteDraftButton } from './components/CompleteDraftButton';

export function ProposalStickyFooter({
  proposal,
  page,
  refreshProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  page: { title: string };
  refreshProposal: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { trigger: publishProposal, isMutating } = usePublishProposal({ proposalId: proposal.id });

  async function onClick() {
    try {
      await publishProposal();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    refreshProposal();
  }
  const disabledTooltip = getProposalErrors({
    proposal: {
      type: 'proposal',
      title: page.title,
      ...proposal
    }
  }).join('\n');

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <Button
          disabledTooltip={disabledTooltip}
          disabled={!!disabledTooltip}
          data-test='complete-draft-button'
          loading={isMutating}
          onClick={onClick}
        >
          Publish
        </Button>
      </Box>
    </StickyFooterContainer>
  );
}
