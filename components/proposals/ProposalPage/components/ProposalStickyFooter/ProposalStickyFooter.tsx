import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { PublishRewardsButton } from '../EvaluationSidebar/components/PublishRewardsButton';

import { CompleteDraftButton } from './components/CompleteDraftButton';
import { CompleteFeedbackButton } from './components/CompleteFeedbackButton';
import { GoBackButton } from './components/GoBackButton';

export type EvaluationTypeOrDraft = ProposalEvaluationType | 'draft';

// Currently this is just used for proposals but there's no reason not to add logic for other page types here
export function ProposalStickyFooter({
  proposal,
  refreshProposal
}: {
  proposal: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}) {
  const currentEvaluation = proposal.evaluations.find((e) => e.id === proposal.currentEvaluationId);
  const currentEvaluationIndex = proposal?.evaluations.findIndex((e) => e.id === currentEvaluation?.id) ?? -1;

  const previousStep = proposal.evaluations[currentEvaluationIndex - 1];
  const nextStep = proposal.evaluations[currentEvaluationIndex + 1];

  // determine which buttons we need
  let evaluationTypeOrDraft: EvaluationTypeOrDraft | undefined;
  if (currentEvaluation) {
    evaluationTypeOrDraft = currentEvaluation?.type;
  } else if (proposal?.status === 'draft') {
    evaluationTypeOrDraft = 'draft';
  }

  const showPublishRewards =
    !!currentEvaluation?.result &&
    !!(proposal.fields as ProposalFields)?.pendingRewards?.length &&
    !proposal.rewardIds?.length;

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='flex-end' alignItems='center' width='100%'>
        {evaluationTypeOrDraft === 'draft' && !showPublishRewards && (
          <CompleteDraftButton proposalId={proposal.id} nextStep={nextStep} onSubmit={refreshProposal} />
        )}
        {/* {showPublishRewards && (
          <PublishRewardsButton
            disabled={!proposal.permissions.evaluate}
            proposalId={proposal.id}
            onSubmit={refreshProposal}
          />
        )} */}
      </Box>
    </StickyFooterContainer>
  );
}
