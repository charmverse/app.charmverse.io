import type { ProposalEvaluation } from '@charmverse/core/prisma';

import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

import { Stepper } from './components/Stepper';

type EvaluationStepperProps = {
  evaluations: Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'>[];
  isDraft?: boolean;
  currentStep?: string;
  onClick: (selectedValue: string) => void;
};

export function EvaluationStepper({ evaluations, isDraft, currentStep, onClick }: EvaluationStepperProps) {
  const currentEvaluation = getCurrentEvaluation(evaluations);
  const currentValue = isDraft ? 'draft' : currentEvaluation?.id;
  const steps = [
    {
      label: 'Draft',
      disabled: true,
      completed: currentValue !== 'draft', // draft is complete if it is any other step
      value: 'draft',
      description: 'Only authors and admins can view and edit'
    },
    ...evaluations.map((evaluation) => ({
      label: evaluation.title,
      completed: !!evaluation.result,
      disabled: evaluation.type === 'feedback',
      description: evaluation.title,
      value: evaluation.id
    }))
  ];
  return <Stepper value={currentValue} steps={steps} onClick={onClick} />;
}
