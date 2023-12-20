import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { useMemo } from 'react';

import {
  useUpdateProposalEvaluation,
  useGetProposalDetails,
  useUpsertRubricCriteria
} from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationSettings';
import { evaluationTypesWithSidebar } from 'components/proposals/ProposalPage/components/EvaluationSidebar/components/ProposalSidebarHeader';

export function useProposal({ proposalId }: { proposalId?: string | null }) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });

  // const evaluationToShowInSidebar = proposal?.permissions.evaluate && proposal?.currentEvaluationId;
  let evaluationToShowInSidebar: string | undefined;
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations ?? []);
  if (currentEvaluation && evaluationTypesWithSidebar.includes(currentEvaluation.type)) {
    evaluationToShowInSidebar = currentEvaluation.id;
  }

  // console.log(proposal?.permissions);
  return useMemo(
    () => ({
      proposal,
      permissions: proposal?.permissions,
      evaluationToShowInSidebar,
      currentEvaluation,
      refreshProposal: () => refreshProposal(), // wrap it in a function so click handlers dont pass in the event
      async onChangeEvaluation(evaluationId: string, updatedEvaluation: Partial<ProposalEvaluationValues>) {
        if (updatedEvaluation.rubricCriteria) {
          await upsertRubricCriteria({
            evaluationId,
            rubricCriteria: updatedEvaluation.rubricCriteria
          });
        } else {
          await updateProposalEvaluation({
            evaluationId,
            ...updatedEvaluation
          });
        }
        await refreshProposal();
      }
    }),
    [
      proposal,
      refreshProposal,
      evaluationToShowInSidebar,
      currentEvaluation,
      updateProposalEvaluation,
      upsertRubricCriteria
    ]
  );
}
