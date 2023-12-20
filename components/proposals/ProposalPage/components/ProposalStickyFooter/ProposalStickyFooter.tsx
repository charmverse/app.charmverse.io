import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box } from '@mui/material';

import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { evaluationTypesWithSidebar } from '../EvaluationSidebar/components/ProposalSidebarHeader';

import { CompleteDraftButton } from './components/CompleteDraftButton';
import { CompleteFeedbackButton } from './components/CompleteFeedbackButton';
import { GoBackButton } from './components/GoBackButton';
import { OpenEvaluationButton } from './components/OpenEvaluationButton';

export type EvaluationTypeOrDraft = ProposalEvaluationType | 'draft';

// Currently this is just used for proposals but there's no reason not to add logic for other page types here
export function ProposalStickyFooter({
  proposal,
  refreshProposal,
  isEvaluationSidebarOpen,
  openEvaluationSidebar
}: {
  proposal: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
  isEvaluationSidebarOpen: boolean;
  openEvaluationSidebar: (evaluationId?: string) => void;
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

  const hasSidebarEvaluation = evaluationTypesWithSidebar.includes(evaluationTypeOrDraft as ProposalEvaluationType);

  return (
    <StickyFooterContainer>
      <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'>
        <GoBackButton
          proposalId={proposal.id}
          previousStep={previousStep}
          isDraft={proposal.status === 'draft'}
          hasMovePermission={proposal.permissions.move}
          onSubmit={refreshProposal}
        />
        {evaluationTypeOrDraft === 'draft' && (
          <CompleteDraftButton proposalId={proposal.id} nextStep={nextStep} onSubmit={refreshProposal} />
        )}
        {evaluationTypeOrDraft === 'feedback' && (
          <CompleteFeedbackButton
            currentStep={currentEvaluation}
            nextStep={nextStep}
            proposalId={proposal.id}
            hasMovePermission={proposal.permissions.move}
            onSubmit={refreshProposal}
          />
        )}
        {hasSidebarEvaluation && (
          <OpenEvaluationButton
            disabled={!proposal.permissions.move || isEvaluationSidebarOpen}
            isEvaluationSidebarOpen={false}
            onClick={() => openEvaluationSidebar(currentEvaluation?.id)}
          />
        )}
      </Box>
    </StickyFooterContainer>
  );
}
