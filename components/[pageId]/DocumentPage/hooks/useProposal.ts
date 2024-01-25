import { useEffect, useMemo } from 'react';

import {
  useUpdateProposalEvaluation,
  useGetProposalDetails,
  useUpsertRubricCriteria,
  useUpdateWorkflow,
  useUpdateProposal
} from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useProposal({ proposalId }: { proposalId?: string | null }) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { trigger: updateProposal } = useUpdateProposal({ proposalId });
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });
  const { trigger: updateProposalWorkflow } = useUpdateWorkflow({ proposalId });
  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    function handleArchivedEvent(value: WebSocketPayload<'proposals_archived'>) {
      if (value.proposalIds.some((id) => id === proposal?.id)) {
        refreshProposal(
          (prev) => ({
            ...prev!,
            archived: value.archived
          }),
          { revalidate: false }
        );
      }
    }
    const unsubscribeFromPageRestores = subscribe('proposals_archived', handleArchivedEvent);
    return () => {
      unsubscribeFromPageRestores();
    };
  }, [refreshProposal, subscribe, proposal?.id]);

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
      },
      onChangeRewardTemplate: async (templateId: string | null) => {
        if (proposal) {
          await updateProposal({
            fields: {
              ...proposal.fields,
              rewardsTemplateId: templateId || undefined
            }
          });
          await refreshProposal();
        }
      }
    }),
    [proposal, refreshProposal, updateProposalEvaluation, updateProposalWorkflow, upsertRubricCriteria, updateProposal]
  );
}
