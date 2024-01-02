import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import type { PageWithContent } from 'lib/pages';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { CompleteDraftButton } from './components/CompleteDraftButton';

export type EvaluationTypeOrDraft = ProposalEvaluationType | 'draft';

export function ProposalStickyFooter({
  proposal,
  refreshProposal,
  page
}: {
  page: PageWithContent;
  proposal: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}) {
  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        <CompleteDraftButton page={page} proposal={proposal} onSubmit={refreshProposal} />
      </Box>
    </StickyFooterContainer>
  );
}
