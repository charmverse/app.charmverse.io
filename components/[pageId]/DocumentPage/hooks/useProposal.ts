import { getCurrentEvaluation } from '@charmverse/core/proposals';
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

  // const evaluationToShowInSidebar = proposal?.permissions.evaluate && proposal?.currentEvaluationId;
  // let evaluationToShowInSidebar: string | undefined;
  // const currentEvaluation = getCurrentEvaluation(proposal?.evaluations ?? []);
  // if (currentEvaluation && evaluationTypesWithSidebar.includes(currentEvaluation.type)) {
  //   evaluationToShowInSidebar = currentEvaluation.id;
  // }
  const readOnlyProperties = !proposal?.permissions.edit;
  const readOnlyReviewers = Boolean(readOnlyProperties || !!proposal?.page?.sourceTemplateId);
  // rubric criteria can always be updated by reviewers and admins, but criteria from a template are only editable by admin
  const readOnlyRubricCriteria = Boolean(
    readOnlyProperties && (!proposal?.permissions.evaluate || proposal?.page?.sourceTemplateId)
  );

  // console.log(proposal?.permissions);
  return useMemo(
    () => ({
      proposal,
      permissions: proposal?.permissions,
      // evaluationToShowInSidebar,
      // currentEvaluation,
      readOnlyReviewers,
      readOnlyRubricCriteria,
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
      // evaluationToShowInSidebar,
      // currentEvaluation,
      readOnlyReviewers,
      readOnlyRubricCriteria,
      updateProposalEvaluation,
      upsertRubricCriteria
    ]
  );
}
