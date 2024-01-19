import { useMemo } from 'react';

import {
  useUpdateProposalEvaluation,
  useGetProposalDetails,
  useUpsertRubricCriteria,
  useUpdateWorkflow,
  useArchiveProposal
} from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';

export function useProposal({ proposalId }: { proposalId?: string | null }) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });
  const { trigger: updateProposalWorkflow } = useUpdateWorkflow({ proposalId });
  return useMemo(
    () => ({
      proposal,
      permissions: proposal?.permissions,
      refreshProposal: () => refreshProposal(), // wrap it in a function so click handlers dont pass in the event
      async onChangeEvaluation(evaluationId: string, updatedEvaluation: Partial<ProposalEvaluationValues>) {
        if (updatedEvaluation.rubricCriteria) {
          await upsertRubricCriteria({
            evaluationId,
            rubricCriteria: updatedEvaluation.rubricCriteria
          });
        }
        const otherFields = Object.keys(updatedEvaluation).filter((key) => key !== 'rubricCriteria');
        if (otherFields.length > 0) {
          await updateProposalEvaluation({
            evaluationId,
            ...updatedEvaluation
          });
        }
        await refreshProposal();
      },
      onChangeWorkflow: async ({ id }: { id: string }) => {
        await updateProposalWorkflow({ workflowId: id });
        await refreshProposal();
      }
    }),
    [proposal, refreshProposal, updateProposalEvaluation, updateProposalWorkflow, upsertRubricCriteria]
  );
}
