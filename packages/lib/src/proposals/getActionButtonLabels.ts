import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';

export const customLabelEvaluationTypes = ['pass_fail', 'rubric'] as ProposalEvaluationType[];

export function getActionButtonLabels(evaluation?: Pick<WorkflowEvaluationJson, 'actionLabels'> | null) {
  const actionLabels = evaluation?.actionLabels as WorkflowEvaluationJson['actionLabels'];
  return {
    approve: actionLabels?.approve || 'Pass',
    reject: actionLabels?.reject || 'Decline'
  };
}
