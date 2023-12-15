import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { useMembers } from 'hooks/useMembers';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

import { evaluationTypesWithSidebar } from '../EvaluationSidebar/components/ProposalSidebarHeader';
import { evaluationLabels } from '../ProposalProperties/components/ProposalEvaluationSelect';

import type { Step } from './components/Stepper';
import { Stepper } from './components/Stepper';

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
  const { membersRecord } = useMembers();
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
          ? `${evaluation.result === 'pass' ? 'Passed' : 'Rejected'} by ${
              membersRecord[evaluation.decidedBy]?.username
            }`
          : evaluationLabels[evaluation.type];
      return {
        label: evaluation.title,
        result: evaluation.result,
        disabled: !!disabled || !evaluationTypesWithSidebar.includes(evaluation.type),
        description,
        value: evaluation.id
      };
    })
  ];
  return <Stepper selected={selected} value={currentValue} steps={steps} onClick={onClick} />;
}
