import { Alert, SvgIcon } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

import { RubricAnswersForm } from './RubricAnswersForm';
import { RubricResults } from './RubricResults';

export type Props = {
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    'id' | 'evaluations' | 'permissions' | 'status' | 'evaluationType' | 'archived'
  >;
  permissions?: ProposalWithUsersAndRubric['permissions'];
  evaluation: PopulatedEvaluation;
  isCurrent?: boolean;
  refreshProposal?: VoidFunction;
};

export function RubricEvaluation({ proposal, permissions, isCurrent, evaluation, refreshProposal }: Props) {
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const canAnswerRubric = permissions?.evaluate;
  const rubricCriteria = evaluation?.rubricCriteria;
  const myRubricAnswers = useMemo(
    () => evaluation?.rubricAnswers.filter((answer) => answer.userId === user?.id) || [],
    [user?.id, evaluation?.rubricAnswers]
  );
  const myDraftRubricAnswers = useMemo(
    () => evaluation?.draftRubricAnswers.filter((answer) => answer.userId === user?.id),
    [user?.id, evaluation?.draftRubricAnswers]
  );

  const canViewRubricAnswers = isAdmin || canAnswerRubric;

  async function onSubmitEvaluation({ isDraft }: { isDraft: boolean }) {
    if (!isDraft) {
      await refreshProposal?.();
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
  const evaluationTabs = canViewRubricAnswers ? ['Your evaluation', 'Results'] : ['Your evaluation'];

  return (
    <>
      {evaluationTabs.length > 0 && (
        <>
          <Alert severity='info'>
            {canAnswerRubric
              ? 'Evaluation results are only visible to Reviewers'
              : 'Only Reviewers can submit an evaluation'}
          </Alert>

          <MultiTabs activeTab={rubricView} setActiveTab={setRubricView} tabs={evaluationTabs}>
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
                    archived={proposal?.archived ?? false}
                    key='results'
                    answers={evaluation?.rubricAnswers}
                    criteriaList={rubricCriteria || []}
                    isCurrent={!!isCurrent}
                    evaluation={evaluation}
                    isReviewer={proposal?.permissions.evaluate}
                    proposalId={proposal?.id}
                    refreshProposal={refreshProposal}
                  />
                )}
              </>
            )}
          </MultiTabs>
        </>
      )}
      {evaluationTabs.length === 0 && !proposal && <LoadingComponent isLoading={true} />}
      {evaluationTabs.length === 0 && proposal && (
        <NoCommentsMessage
          icon={
            <SvgIcon
              component={RiChatCheckLine}
              color='secondary'
              fontSize='large'
              sx={{ mb: '1px', height: '2em', width: '2em' }}
            />
          }
          message='Evaluation is not enabled for this proposal'
        />
      )}
    </>
  );
}
