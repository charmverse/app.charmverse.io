import { useMemo, useState } from 'react';

import { useGetAllReviewerUserIds } from 'charmClient/hooks/proposals';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

export type Props = {
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'permissions'>;
  evaluation: PopulatedEvaluation;
  refreshProposal?: VoidFunction;
};

export function VoteSidebar({ pageId, proposal, evaluation, refreshProposal }: Props) {
  const [rubricView, setRubricView] = useState<number>(0);
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const { data: reviewerUserIds } = useGetAllReviewerUserIds(
    !!pageId && evaluation?.type === 'rubric' ? pageId : undefined
  );
  const isReviewer = proposal?.permissions.evaluate;

  const canViewRubricAnswers = isAdmin || isReviewer;

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

  return <>Vote here!</>;
}
