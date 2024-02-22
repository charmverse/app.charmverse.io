import { Box } from '@mui/material';

import { usePublishProposal } from 'charmClient/hooks/proposals';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getProposalErrors } from 'lib/proposal/getProposalErrors';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

export function ProposalStickyFooter({
  proposal,
  page,
  refreshProposal,
  isStructuredProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  page: { title: string; content?: any };
  refreshProposal: VoidFunction;
  isStructuredProposal: boolean;
}) {
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
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
    page: {
      content: page.content,
      title: page.title,
      type: 'proposal'
    },
    isDraft: proposal.status === 'draft',
    proposalType: isStructuredProposal ? 'structured' : 'free_form',
    proposal: {
      ...proposal,
      formFields: proposal.form?.formFields || undefined,
      authors: proposal.authors.map((a) => a.userId)
    },
    requireTemplates: !!space?.requireProposalTemplate
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
