import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { useEffect, useState } from 'react';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { RubricEvaluation } from './components/RubricEvaluation';
import { ProposalSidebarHeader } from './ProposalSidebarHeader';

export type Props = {
  pageId?: string;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    'id' | 'authors' | 'evaluations' | 'permissions' | 'status' | 'evaluationType'
  >;
  evaluationId?: string | null;
  refreshProposal?: VoidFunction;
  goToEditProposal: VoidFunction;
};

export function ProposalEvaluationSidebar({
  pageId,
  proposal,
  evaluationId: evaluationIdFromContext = null,
  refreshProposal,
  goToEditProposal
}: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(evaluationIdFromContext);
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations || []);

  const evaluation = proposal?.evaluations.find((e) => e.id === activeEvaluationId);

  useEffect(() => {
    setActiveEvaluationId(evaluationIdFromContext);
  }, [evaluationIdFromContext]);

  useEffect(() => {
    // set the first evaluation by default if evaluationIdFromContext is not provided
    if (currentEvaluation && !evaluationIdFromContext && !activeEvaluationId) {
      setActiveEvaluationId(currentEvaluation.id);
    }
  }, [!!currentEvaluation, !!evaluationIdFromContext, !!activeEvaluationId]);

  const isCurrent = currentEvaluation?.id === evaluation?.id;

  return (
    <>
      <ProposalSidebarHeader
        activeEvaluationId={activeEvaluationId}
        evaluations={proposal?.evaluations || []}
        goToEvaluation={setActiveEvaluationId}
        goToSettings={goToEditProposal}
      />

      {evaluation?.type === 'rubric' && (
        <RubricEvaluation {...{ pageId, proposal, isCurrent, evaluation, refreshProposal, goToEditProposal }} />
      )}
      {evaluation?.type === 'feedback' && (
        <FeedbackEvaluation {...{ proposal, isCurrent, evaluation, goToEditProposal }} />
      )}
      {evaluation?.type === 'pass_fail' && (
        <PassFailEvaluation {...{ proposal, isCurrent, evaluation, refreshProposal }} />
      )}
    </>
  );
}
