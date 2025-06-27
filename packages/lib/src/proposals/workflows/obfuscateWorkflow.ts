import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { privateEvaluationSteps, type WorkflowEvaluationJson } from '@packages/core/proposals';

export function obfuscateWorkflow({ evaluations }: { evaluations: WorkflowEvaluationJson[] }) {
  const stepsWithCollapsedEvaluations: WorkflowEvaluationJson[] = [];

  for (let i = 0; i < evaluations.length; i++) {
    const previousStep = stepsWithCollapsedEvaluations[stepsWithCollapsedEvaluations.length - 1];
    const currentStep = evaluations[i];

    const isConcealableEvaluation = privateEvaluationSteps.includes(currentStep.type as ProposalEvaluationType);

    if (!isConcealableEvaluation) {
      stepsWithCollapsedEvaluations.push(currentStep);
    } else if (previousStep?.type !== ('private_evaluation' as ProposalEvaluationType)) {
      stepsWithCollapsedEvaluations.push({
        id: currentStep.id,
        permissions: [],
        title: 'Evaluation',
        type: 'private_evaluation' as ProposalEvaluationType,
        actionLabels: null
      });
    }
  }

  return stepsWithCollapsedEvaluations;
}
