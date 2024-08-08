import { Alert, Box, SvgIcon, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposals/interfaces';

import { PassFailEvaluationContainer } from '../PassFailEvaluationContainer';

import { RubricAnswersForm } from './RubricAnswersForm';
import { RubricResults } from './RubricResults';

export type Props = {
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'evaluations' | 'permissions' | 'status' | 'archived' | 'authors'>;
  evaluation: PopulatedEvaluation;
  isCurrent?: boolean;
  refreshProposal?: VoidFunction;
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
    [user?.id, !!evaluation?.draftRubricAnswers]
  );

  const canViewRubricAnswers = isAdmin || canAnswerRubric;

  async function onSubmitEvaluation({ isDraft }: { isDraft: boolean }) {
    if (proposal) {
      await refreshProposal?.();
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
                    authors={proposal?.authors?.map((author) => author.userId) || []}
                    answers={evaluation?.rubricAnswers}
                    criteriaList={rubricCriteria || []}
                    isCurrent={!!isCurrent}
                    evaluation={evaluation}
                    proposalId={proposal?.id}
                    refreshProposal={refreshProposal}
                  />
                )}
              </>
            )}
          </MultiTabs>
        </>
      )}
      <Box mx={2}>
        <Typography variant='subtitle1' sx={{ mb: 1 }}>
          Decision
        </Typography>

        <PassFailEvaluationContainer
          isCurrent={!!isCurrent}
          hideReviewer
          authors={proposal?.authors?.map((a) => a.userId) ?? []}
          archived={!!proposal?.archived}
          actionCompletesStep
          key='results'
          evaluation={evaluation}
          proposalId={proposal?.id}
          confirmationMessage='Please verify that all reviewers have submitted a response. This will submit the final review for this step.'
          refreshProposal={refreshProposal}
        />
      </Box>
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
