import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { Alert } from '@mui/material';
import { useMemo, useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PopulatedEvaluation, ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import { showRubricAnswersToAuthor } from 'lib/proposals/showRubricAnswersToAuthor';

import { RubricAnswersForm } from './components/RubricAnswersForm';
import { RubricDecision } from './components/RubricDecision';
import { RubricResults } from './components/RubricResults';

export type Props = {
  proposal: Pick<
    ProposalWithUsersAndRubric,
    'id' | 'createdBy' | 'evaluations' | 'permissions' | 'status' | 'archived' | 'authors'
  >;
  evaluation: PopulatedEvaluation;
  isCurrent: boolean;
  refreshProposal: VoidFunction;
};

export function RubricEvaluation({ proposal, isCurrent, evaluation, refreshProposal }: Props) {
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const canAnswerRubric = !!evaluation.isReviewer;
  const rubricCriteria = evaluation?.rubricCriteria;
  const myRubricAnswers = useMemo(
    () => evaluation?.rubricAnswers.filter((answer) => answer.userId === user?.id) || [],
    [user?.id, !!evaluation?.rubricAnswers]
  );
  const myDraftRubricAnswers = useMemo(
    () => evaluation?.draftRubricAnswers.filter((answer) => answer.userId === user?.id),
    // watch the size of draft answers so they refresh when the user deletes them
    [user?.id, !!evaluation?.draftRubricAnswers?.length]
  );

  const isAuthor = proposal.createdBy === user?.id || proposal.authors.some((a) => a.userId === user?.id);

  const authorCanViewFailedEvaluationResults = showRubricAnswersToAuthor({
    isAuthor,
    evaluationType: evaluation.type as ProposalEvaluationType,
    isCurrentEvaluationStep: isCurrent,
    proposalFailed: isCurrent && evaluation.result === 'fail',
    showAuthorResultsOnRubricFail: !!evaluation.showAuthorResultsOnRubricFail
  });

  const canViewRubricAnswers =
    isAdmin || canAnswerRubric || evaluation.shareReviews || authorCanViewFailedEvaluationResults;
  async function onSubmitEvaluation({ isDraft }: { isDraft: boolean }) {
    if (proposal) {
      await refreshProposal();
    }
    if (!isDraft) {
      // Set view to "Results tab", assuming Results is the 2nd tab, ie value: 1
      setRubricView(1);
    }
  }
  /**
   *
   *  Tab visibility rules:
   *  Evaluate: visible when evaluation is active or closed, and only if you are a reviewer
   *  Results: visible to anyone when evaluation is active or closed, disabled if you are not a reviewer
   *
   * */
  const evaluationTabs = canViewRubricAnswers
    ? ['Your evaluation', 'Results', 'Decision']
    : ['Your evaluation', 'Decision'];

  return (
    <>
      <Alert severity='info'>
        {evaluation.shareReviews || authorCanViewFailedEvaluationResults
          ? 'Evaluation results are anonymous'
          : evaluation.isReviewer
            ? 'Evaluation results are only visible to Reviewers'
            : 'Only Reviewers can submit an evaluation'}
      </Alert>

      <MultiTabs activeTab={rubricView} setActiveTab={setRubricView} tabs={evaluationTabs} fullWidthTabs>
        {({ value }) => (
          <>
            {value === 'Your evaluation' && (
              <RubricAnswersForm
                key='evaluate'
                proposalId={proposal?.id || ''}
                evaluationId={evaluation.id}
                answers={myRubricAnswers}
                draftAnswers={myDraftRubricAnswers}
                criteriaList={rubricCriteria!}
                onSubmit={onSubmitEvaluation}
                archived={proposal?.archived ?? false}
                disabled={!canAnswerRubric || !isCurrent || !!proposal?.archived}
              />
            )}
            {value === 'Results' && (
              <RubricResults
                key='results'
                answers={evaluation?.rubricAnswers}
                showReviewerIdentities={isAdmin || canAnswerRubric}
                criteriaList={rubricCriteria || []}
                evaluation={evaluation}
              />
            )}
            {value === 'Decision' && (
              <RubricDecision
                key='decision'
                proposal={proposal}
                isCurrent={isCurrent}
                evaluation={evaluation}
                refreshProposal={refreshProposal}
              />
            )}
          </>
        )}
      </MultiTabs>
    </>
  );
}
