import { useEffect, useState } from 'react';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { RubricEvaluation } from './components/RubricEvaluation';

export type Props = {
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  evaluationId?: string | null;
  refreshProposal?: VoidFunction;
  goToEditProposal: VoidFunction;
};

export function ProposalEvaluationSidebar({
  pageId,
  proposal,
  evaluationId = null,
  refreshProposal,
  goToEditProposal
}: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(evaluationId);

  const evaluation = proposal?.evaluations.find((e) => e.id === activeEvaluationId);

  useEffect(() => {
    setActiveEvaluationId(evaluationId);
  }, [evaluationId]);

  useEffect(() => {
    if (!evaluationId && proposal?.evaluations.length) {
      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      // load the first evaluation on load by default
      if (currentEvaluation) {
        setActiveEvaluationId(currentEvaluation.id);
      }
    }
  }, []);

  if (evaluation?.type === 'rubric') {
    return <RubricEvaluation {...{ pageId, proposal, evaluation, refreshProposal, goToEditProposal }} />;
  } else if (evaluation?.type === 'feedback') {
    return <FeedbackEvaluation {...{ proposal, evaluation, goToEditProposal }} />;
  } else if (evaluation?.type === 'pass_fail') {
    return <PassFailEvaluation {...{ proposal, evaluation, goToEditProposal }} />;
  }
  return null;
}
