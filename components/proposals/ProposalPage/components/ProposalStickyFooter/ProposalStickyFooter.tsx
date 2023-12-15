import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { CompleteFeedbackButton } from './components/CompleteFeedbackButton';
import { PublishDraftButton } from './components/PublishDraftButton';
import { ReviewPassFailButton } from './components/ReviewPassFailButton';

// Currently this is just used for proposals but there's no reason not to add logic for other page types here
export function ProposalStickyFooter({
  proposal,
  refreshProposal
}: {
  proposal?: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
}) {
  const isCharmVerse = useIsCharmverseSpace();
  if (!isCharmVerse) {
    return null;
  }

  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);

  // determine which buttons we need
  let view: string | undefined;
  if (currentEvaluation?.type === 'feedback') {
    view = 'feedback';
  } else if (proposal?.status === 'draft') {
    view = 'draft';
  } else if (currentEvaluation?.type === 'pass_fail') {
    view = 'pass_fail';
  }
  if (!view) {
    return null;
  }

  return (
    <StickyFooterContainer>
      {view === 'draft' && <PublishDraftButton {...{ proposal, refreshProposal }} />}
      {view === 'feedback' && (
        <CompleteFeedbackButton {...{ proposal, evaluationId: proposal?.currentEvaluationId, refreshProposal }} />
      )}
      {view === 'pass_fail' && (
        <ReviewPassFailButton
          {...{ proposalId: proposal?.id, evaluationId: proposal?.currentEvaluationId, refreshProposal }}
        />
      )}
    </StickyFooterContainer>
  );
}
