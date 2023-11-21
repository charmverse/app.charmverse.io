import { Alert, SvgIcon } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { useGetAllReviewerUserIds } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { isTruthy } from 'lib/utilities/types';

import { NoCommentsMessage } from '../CommentsSidebar';

import { RubricEvaluationForm } from './RubricEvaluationForm';
import { RubricResults } from './RubricResults';

type Props = {
  pageId?: string;
  proposalId: string | null;
  proposal?: ProposalWithUsersAndRubric;
  refreshProposal: VoidFunction;
};

export function ProposalSidebar({ pageId, proposal, proposalId, refreshProposal }: Props) {
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const { permissions: proposalPermissions } = useProposalPermissions({
    proposalIdOrPath: proposalId
  });
  const { data: reviewerUserIds } = useGetAllReviewerUserIds(
    !!pageId && proposal?.evaluationType === 'rubric' ? pageId : undefined
  );
  const canAnswerRubric = proposalPermissions?.evaluate;
  const isReviewer = !!(user?.id && reviewerUserIds?.includes(user.id));
  const rubricCriteria = proposal?.rubricCriteria;

  const myRubricAnswers = useMemo(
    () => proposal?.rubricAnswers.filter((answer) => answer.userId === user?.id) || [],
    [user?.id, proposal?.rubricAnswers]
  );
  const myDraftRubricAnswers = useMemo(
    () => proposal?.draftRubricAnswers.filter((answer) => answer.userId === user?.id),
    [user?.id, proposal?.draftRubricAnswers]
  );

  const canViewRubricAnswers = isAdmin || isReviewer;

  async function onSubmitEvaluation({ isDraft }: { isDraft: boolean }) {
    if (!isDraft) {
      await refreshProposal();
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
  const evaluationTabs = useMemo<TabConfig[]>(() => {
    const proposalStatus = proposal?.status;
    if (proposalStatus !== 'evaluation_active' && proposalStatus !== 'evaluation_closed') {
      return [];
    }
    const tabs = [
      [
        'Evaluate',
        <RubricEvaluationForm
          key='evaluate'
          proposalId={proposalId!}
          answers={myRubricAnswers}
          draftAnswers={myDraftRubricAnswers}
          criteriaList={rubricCriteria!}
          onSubmit={onSubmitEvaluation}
          disabled={!canAnswerRubric}
        />,
        { sx: { p: 0 } } // disable default padding of tab panel
      ] as TabConfig,
      canViewRubricAnswers &&
        ([
          'Results',
          <RubricResults key='results' answers={proposal?.rubricAnswers ?? []} criteriaList={rubricCriteria || []} />,
          { sx: { p: 0 } }
        ] as TabConfig)
    ].filter(isTruthy);
    return tabs;
  }, [
    canAnswerRubric,
    canViewRubricAnswers,
    proposal,
    proposalId,
    myDraftRubricAnswers,
    myRubricAnswers,
    rubricCriteria
  ]);

  return (
    <>
      {evaluationTabs.length > 0 && (
        <>
          <Alert severity='info'>
            {canAnswerRubric
              ? 'Your evaluation is only viewable by the Reviewers assigned to this Proposal'
              : 'Only Reviewers can submit an evaluation'}
          </Alert>
          <MultiTabs activeTab={rubricView} setActiveTab={setRubricView} tabs={evaluationTabs} />
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
