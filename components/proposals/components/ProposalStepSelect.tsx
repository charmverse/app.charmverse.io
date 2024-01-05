import { useMemo } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import type { CardPageProposal } from 'lib/focalboard/card';

import { useProposalUpdateStatusAndStep } from '../hooks/useProposalUpdateStatusAndStep';

export function ProposalStepSelect({ proposal, readOnly }: { proposal: CardPageProposal; readOnly: boolean }) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationResult = proposal.currentStep.result;

  const { updateProposalStep } = useProposalUpdateStatusAndStep();
  const { currentValue, options } = useMemo(() => {
    const _options: IPropertyOption[] = [
      {
        id: 'draft',
        value: 'Draft',
        color: 'gray'
      },
      ...(proposal.evaluations || []).map((evaluation) => ({
        id: evaluation.id,
        value: evaluation.title,
        color: 'gray'
      })),
      ...(proposal.hasRewards
        ? [
            {
              id: 'rewards',
              value: 'Rewards',
              color: 'gray'
            }
          ]
        : [])
    ];
    const lastEvaluation = proposal && proposal.evaluations[proposal.evaluations.length - 1];
    const currentEvaluationId = proposal.currentEvaluationId;
    const currentEvaluationIndex = !currentEvaluationId
      ? 0
      : currentEvaluationId === lastEvaluation?.id && lastEvaluation?.result === 'pass' && proposal.hasRewards
      ? _options.length - 1
      : _options.findIndex((e) => e.id === currentEvaluationId);
    _options.forEach((option, index) => {
      option.disabled =
        index >= currentEvaluationIndex ||
        index < currentEvaluationIndex - 1 ||
        (currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass');
    });
    return { options: _options, currentValue: _options[currentEvaluationIndex]?.id };
  }, [proposal, currentEvaluationResult, currentEvaluationStep]);

  async function onChange(evaluationId?: string) {
    updateProposalStep({
      proposalIds: [proposal.id],
      evaluationId
    });
  }
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue);
    }
  }

  return (
    <TagSelect
      disableClearable
      wrapColumn
      includeSelectedOptions
      readOnly={readOnly}
      options={options}
      propertyValue={currentValue ?? ''}
      onChange={onValueChange}
    />
  );
}
