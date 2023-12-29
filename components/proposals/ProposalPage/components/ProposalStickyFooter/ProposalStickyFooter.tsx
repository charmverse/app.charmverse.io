import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { CompleteDraftButton } from './components/CompleteDraftButton';

export type EvaluationTypeOrDraft = ProposalEvaluationType | 'draft';

export function ProposalStickyFooter({
  proposal,
  refreshProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}) {
  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <CompleteDraftButton proposalId={proposal.id} onSubmit={refreshProposal} />
      </Box>
    </StickyFooterContainer>
  );
}
