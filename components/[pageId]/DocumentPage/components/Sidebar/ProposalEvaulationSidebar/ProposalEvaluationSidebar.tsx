import { Alert, Box, Card } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { useGetAllReviewerUserIds, useGetProposalDetails } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { useProposalPermissions } from 'components/proposals/hooks/useProposalPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import { isTruthy } from 'lib/utilities/types';

import { RubricEvaluationForm } from './RubricEvaluationForm';
import { RubricResults } from './RubricResults';

type Props = {
  onSaveRubricCriteriaAnswers?: () => void;
  pageId?: string;
  proposalId: string | null;
};

export function ProposalEvaluationSidebar({ onSaveRubricCriteriaAnswers, pageId, proposalId }: Props) {
  // app state
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  // db state
  const { data: proposal } = useGetProposalDetails(proposalId);
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
    await onSaveRubricCriteriaAnswers?.();
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
  const evaluationTabs = useMemo<TabConfig[]>(() => {
    const proposalStatus = proposal?.status;
    if (proposalStatus !== 'evaluation_active' && proposalStatus !== 'evaluation_closed') {
      return [];
    }
    const tabs = [
      canAnswerRubric &&
        ([
          'Evaluate',
          <LoadingComponent key='evaluate' isLoading={!rubricCriteria}>
            <RubricEvaluationForm
              proposalId={proposalId!}
              answers={myRubricAnswers}
              draftAnswers={myDraftRubricAnswers}
              criteriaList={rubricCriteria!}
              onSubmit={onSubmitEvaluation}
            />
          </LoadingComponent>,
          { sx: { p: 0 } } // disable default padding of tab panel
        ] as TabConfig),
      [
        'Results',
        <LoadingComponent key='results' isLoading={!rubricCriteria}>
          <RubricResults
            answers={proposal?.rubricAnswers ?? []}
            criteriaList={rubricCriteria || []}
            reviewerUserIds={reviewerUserIds ?? []}
            disabled={!canViewRubricAnswers}
          />
        </LoadingComponent>,
        { sx: { p: 0 } }
      ] as TabConfig
    ].filter(isTruthy);
    return tabs;
  }, [
    canAnswerRubric,
    canViewRubricAnswers,
    proposal,
    proposalId,
    myDraftRubricAnswers,
    myRubricAnswers,
    reviewerUserIds,
    rubricCriteria
  ]);
  return (
    <Box>
      {evaluationTabs.length > 0 && (
        <Card variant='outlined' sx={{ my: 2 }}>
          <Alert severity='info'>Your evaluation is only viewable by the Reviewers assigned to this Proposal</Alert>
          <MultiTabs activeTab={rubricView} setActiveTab={setRubricView} tabs={evaluationTabs} />
        </Card>
      )}
    </Box>
  );
}
