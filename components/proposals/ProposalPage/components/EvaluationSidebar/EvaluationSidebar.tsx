import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { useEffect, useState } from 'react';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { WorkflowSelect } from '../WorkflowSelect';

import { PassFailSidebar } from './components/PassFailSidebar';
import { RubricSidebar } from './components/RubricSidebar/RubricSidebar';
import { VoteSidebar } from './components/VoteSidebar';

export type Props = {
  pageId?: string;
  isTemplate?: boolean;
  isNewProposal?: boolean;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    | 'id'
    | 'authors'
    | 'evaluations'
    | 'permissions'
    | 'status'
    | 'evaluationType'
    | 'workflowId'
    | 'currentEvaluationId'
  >;
  refreshProposal?: VoidFunction;
  workflowOptions?: ProposalWorkflowTyped[];
};

const expandableEvaluationTypes: ProposalEvaluationType[] = ['pass_fail', 'rubric', 'vote'];

export function EvaluationSidebar({
  pageId,
  isTemplate,
  isNewProposal,
  proposal,
  refreshProposal,
  workflowOptions
}: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations || []);
  // const evaluationToShowInSidebar = proposal?.permissions.evaluate && proposal?.currentEvaluationId;
  // let evaluationToShowInSidebar: string | undefined;
  // const currentEvaluation = getCurrentEvaluation(proposal?.evaluations ?? []);
  // if (currentEvaluation && evaluationTypesWithSidebar.includes(currentEvaluation.type)) {
  //   evaluationToShowInSidebar = currentEvaluation.id;
  // }

  const evaluation = proposal?.evaluations.find((e) => e.id === activeEvaluationId);

  useEffect(() => {
    // open current evaluation by default
    if (proposal?.currentEvaluationId) {
      setActiveEvaluationId(proposal.currentEvaluationId);
    }
  }, [proposal?.currentEvaluationId, setActiveEvaluationId]);

  const isCurrent = currentEvaluation?.id === evaluation?.id;

  return (
    <>
      <WorkflowSelect value={proposal?.workflowId} readOnly />
      {evaluation?.type === 'pass_fail' && (
        <PassFailSidebar
          key={evaluation.id}
          evaluation={evaluation}
          proposalId={proposal?.id}
          isCurrent={isCurrent}
          isReviewer={proposal?.permissions.evaluate}
          refreshProposal={refreshProposal}
        />
      )}
      {evaluation?.type === 'rubric' && (
        <RubricSidebar key={evaluation.id} {...{ proposal, isCurrent, evaluation, refreshProposal }} />
      )}
      {evaluation?.type === 'vote' && (
        <VoteSidebar
          key={evaluation.id}
          pageId={pageId!}
          proposal={proposal}
          isCurrent={isCurrent}
          evaluation={evaluation}
        />
      )}
    </>
  );
}
