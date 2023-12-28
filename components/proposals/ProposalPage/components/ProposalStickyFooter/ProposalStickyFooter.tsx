import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { CompleteDraftButton } from './components/CompleteDraftButton';

export type EvaluationTypeOrDraft = ProposalEvaluationType | 'draft';

// Currently this is just used for proposals but there's no reason not to add logic for other page types here
export function ProposalStickyFooter({
  proposal,
  refreshProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}) {
  // const currentEvaluation = proposal.evaluations.find((e) => e.id === proposal.currentEvaluationId);
  // const currentEvaluationIndex = proposal?.evaluations.findIndex((e) => e.id === currentEvaluation?.id) ?? -1;

  // const nextStep = proposal.evaluations[currentEvaluationIndex + 1];
  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <CompleteDraftButton proposalId={proposal.id} onSubmit={refreshProposal} />
      </Box>
    </StickyFooterContainer>
  );
}
