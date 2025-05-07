import { useEffect, useMemo } from 'react';

import {
  useUpdateProposalEvaluation,
  useGetProposalDetails,
  useUpsertRubricCriteria,
  useUpdateTemplate,
  useUpdateWorkflow,
  useUpdateProposal
} from 'charmClient/hooks/proposals';
import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/EvaluationStepSettings';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useProposal({ proposalId }: { proposalId?: string | null }) {
  const { data: proposal, mutate: refreshProposal } = useGetProposalDetails(proposalId);
  const { trigger: updateProposal } = useUpdateProposal({ proposalId });
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  const { trigger: upsertRubricCriteria } = useUpsertRubricCriteria({ proposalId });
  const { trigger: applyProposalTemplate } = useUpdateTemplate({ proposalId });
  const { trigger: applyProposalWorkflow } = useUpdateWorkflow({ proposalId });
  const { subscribe } = useWebSocketClient();
  const { refreshIssuableCredentials } = useProposalCredentials({ proposalId });
  useEffect(() => {
    function handleUpdateEvent(proposals: WebSocketPayload<'proposals_updated'>) {
      const match = proposals.find(({ id }) => id === proposal?.id);
      if (match) {
        refreshProposal(
          (prev) =>
            prev
              ? {
                  ...prev,
                  currentEvaluationId: match.currentStep ? match.currentStep?.id : prev.currentEvaluationId,
                  archived: match.archived ?? prev.archived,
                  status: match.currentStep ? (match.currentStep.step === 'draft' ? 'draft' : 'published') : prev.status
                }
              : undefined,
          { revalidate: false }
        );
      }
    }
    const unsubscribeFromPageRestores = subscribe('proposals_updated', handleUpdateEvent);
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
      onChangeTemplate: async (value: { id: string } | null) => {
        // null will remove the template
        await applyProposalTemplate({ templateId: value?.id || null });
        await refreshProposal();
      },
      onChangeWorkflow: async ({ id }: { id: string }) => {
        await applyProposalWorkflow({ workflowId: id });
        await refreshProposal();
      },
      onChangeRewardSettings: async (values: Partial<ProposalFields>) => {
        if (proposal) {
          await updateProposal({
            fields: {
              ...proposal.fields,
              ...values
            }
          });
          await refreshProposal();
        }
      },
      onChangeSelectedCredentialTemplates: async (templateIds: string[]) => {
        if (proposal) {
          await updateProposal({
            selectedCredentialTemplates: templateIds
          });
          await refreshProposal();
          await refreshIssuableCredentials();
        }
      }
    }),
    [proposal, refreshProposal, updateProposalEvaluation, applyProposalWorkflow, upsertRubricCriteria, updateProposal]
  );
}
