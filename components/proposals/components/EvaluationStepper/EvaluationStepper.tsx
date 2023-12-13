import type { ProposalEvaluation } from '@charmverse/core/prisma';

import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

import { evaluationLabels } from '../ProposalProperties/components/ProposalEvaluationSelect';

import { Stepper } from './components/Stepper';

type EvaluationStepperProps = {
  evaluations: Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'>[];
  isDraft?: boolean;
  selected?: string | null; // the evaluation active in the sidebar
  disabled?: boolean; // used for new proposal UI
  onClick?: (selectedValue: string) => void;
};

export function EvaluationStepper({
  evaluations,
  isDraft,
  disabled,
  selected,
  onClick = () => {}
}: EvaluationStepperProps) {
  const currentEvaluation = getCurrentEvaluation(evaluations);
  const currentValue = isDraft ? 'draft' : currentEvaluation?.id;
  const steps = [
    {
      label: 'Draft',
      disabled: true,
      completed: currentValue !== 'draft', // draft is complete if it is any other step
      value: 'draft',
      description: evaluationLabels.draft
    },
    ...evaluations.map((evaluation) => ({
      label: evaluation.title,
      completed: !!evaluation.result,
      disabled: !!disabled,
      description: evaluationLabels[evaluation.type],
      value: evaluation.id
    }))
  ];
  return <Stepper selected={selected} value={currentValue} steps={steps} onClick={onClick} />;
}
