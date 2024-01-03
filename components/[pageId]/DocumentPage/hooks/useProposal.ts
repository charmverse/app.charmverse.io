import { useMemo } from 'react';

import {
  useUpdateProposalEvaluation,
  useGetProposalDetails,
  useUpsertRubricCriteria
} from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';

export function useProposal({ proposalId }: { proposalId?: string | null }) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });

  const readOnlyReviewers = !proposal?.permissions.edit;
  // rubric criteria can always be updated by reviewers and admins, but criteria from a template are only editable by admin
  const readOnlyRubricCriteria = !proposal?.permissions.edit && !proposal?.permissions.evaluate;

  return useMemo(
    () => ({
      proposal,
      permissions: proposal?.permissions,
      readOnlyReviewers,
      readOnlyRubricCriteria,
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
      }
    }),
    [
      proposal,
      refreshProposal,
      readOnlyReviewers,
      readOnlyRubricCriteria,
      updateProposalEvaluation,
      upsertRubricCriteria
    ]
  );
}
