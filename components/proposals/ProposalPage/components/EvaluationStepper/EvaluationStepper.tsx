import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { getRelativeTimeInThePast } from 'lib/utilities/dates';

import type { Step } from './components/Stepper';
import { Stepper } from './components/Stepper';

const evaluationLabels = {
  draft: 'Only authors can view and edit',
  [ProposalEvaluationType.feedback]: 'Request feedback',
  [ProposalEvaluationType.vote]: 'Evaluation by vote',
  [ProposalEvaluationType.rubric]: 'Evaluation by rubric',
  [ProposalEvaluationType.pass_fail]: 'Approval is required to proceed'
};

type EvaluationStepperProps = {
  evaluations: (Pick<ProposalEvaluation, 'id' | 'index' | 'title' | 'result' | 'type'> &
    Partial<Pick<ProposalEvaluation, 'decidedBy' | 'completedAt'>>)[];
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
  const steps: Step[] = [
    {
      label: 'Draft',
      disabled: true,
      value: 'draft',
      result: currentValue !== 'draft' ? 'pass' : null, // draft is complete if it is any other step
      description: evaluationLabels.draft
    },
    ...evaluations.map((evaluation) => {
      const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
      const description =
        evaluation.type === 'feedback' && evaluation.result
          ? `Completed ${completedDate}`
          : evaluation.decidedBy
          ? `${evaluation.result === 'pass' ? 'Passed' : 'Declined'}
            }`
          : evaluationLabels[evaluation.type];
      return {
        label: evaluation.title,
        result: evaluation.result,
        disabled: !!disabled,
        description,
        value: evaluation.id
      };
    })
  ];
  return <Stepper selected={selected} value={currentValue} steps={steps} onClick={onClick} />;
}
