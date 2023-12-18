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
  const currentEvaluation = proposal?.evaluations.find((evaluation) => evaluation.id === proposal?.currentEvaluationId);
  if (currentEvaluation && evaluationTypesWithSidebar.includes(currentEvaluation.type)) {
    evaluationToShowInSidebar = currentEvaluation.id;
  }

  // console.log(proposal?.permissions);
  return useMemo(
    () => ({
      proposal,
      permissions: proposal?.permissions,
      evaluationToShowInSidebar,
      refreshProposal,
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
    [proposal, refreshProposal, evaluationToShowInSidebar, updateProposalEvaluation, upsertRubricCriteria]
  );
}
