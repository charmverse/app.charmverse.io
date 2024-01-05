import { useMemo } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import type { ProposalWithUsersLite } from 'lib/proposal/interface';

import { useProposalUpdateStatusAndStep } from '../hooks/useProposalUpdateStatusAndStep';

type ProposalProp = {
  currentStep: ProposalWithUsersLite['currentStep'];
  currentEvaluationId?: ProposalWithUsersLite['currentEvaluationId'];
  evaluations: ProposalWithUsersLite['evaluations'];
  hasRewards: boolean;
  id: string;
};

export function ControlledProposalStepSelect({
  proposal,
  onChange
}: {
  proposal: ProposalProp;
  onChange: (evaluationId: string) => void;
}) {
  return <ProposalStepSelectBase proposal={proposal} onChange={onChange} readOnly={false} />;
}

export function ProposalStepSelect({ proposal, readOnly }: { proposal: ProposalProp; readOnly: boolean }) {
  const { updateProposalStep } = useProposalUpdateStatusAndStep();

  function onValueChange(evaluationId: string) {
    updateProposalStep([
      {
        evaluationId,
        proposalId: proposal.id
      }
    ]);
  }

  return <ProposalStepSelectBase proposal={proposal} onChange={onValueChange} readOnly={readOnly} />;
}

export function ProposalStepSelectBase({
  proposal,
  readOnly,
  onChange
}: {
  proposal: ProposalProp;
  readOnly: boolean;
  onChange: (evaluationId: string) => void;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationResult = proposal.currentStep.result;
  const hasRewards = proposal.hasRewards;
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
      ...(hasRewards
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
      : currentEvaluationId === lastEvaluation?.id && lastEvaluation?.result === 'pass' && hasRewards
      ? _options.length - 1
      : _options.findIndex((e) => e.id === currentEvaluationId);
    _options.forEach((option, index) => {
      option.disabled =
        index >= currentEvaluationIndex ||
        index < currentEvaluationIndex - 1 ||
        (currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass');
    });
    return { options: _options, currentValue: _options[currentEvaluationIndex]?.id };
  }, [proposal, currentEvaluationResult, currentEvaluationStep, hasRewards]);

  return (
    <TagSelect
      disableClearable
      wrapColumn
      includeSelectedOptions
      readOnly={readOnly}
      options={options}
      propertyValue={currentValue ?? ''}
      onChange={(values) => {
        const evaluationId = Array.isArray(values) ? values[0] : values;
        if (evaluationId) {
          onChange(evaluationId);
        }
      }}
    />
  );
}
