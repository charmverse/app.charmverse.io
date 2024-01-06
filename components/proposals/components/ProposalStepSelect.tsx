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
  onChange: (data: { evaluationId: string; moveForward: boolean }) => void;
}) {
  return <ProposalStepSelectBase proposal={proposal} onChange={onChange} readOnly={false} />;
}

export function ProposalStepSelect({ proposal, readOnly }: { proposal: ProposalProp; readOnly: boolean }) {
  const { batchUpdateProposalSteps } = useProposalUpdateStatusAndStep();

  function onValueChange({ evaluationId, moveForward }: { evaluationId: string; moveForward: boolean }) {
    batchUpdateProposalSteps(
      [
        {
          evaluationId,
          proposalId: proposal.id,
          currentEvaluationStep: proposal.currentStep.step
        }
      ],
      moveForward
    );
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
  onChange: (data: { evaluationId: string; moveForward: boolean }) => void;
}) {
  const hasRewards = proposal.hasRewards;

  const { options } = useMemo(() => {
    const currentEvaluationStep = proposal.currentStep.step;
    const currentEvaluationIndex = proposal.currentStep.index;
    const currentEvaluationResult = proposal.currentStep.result;

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

    _options.forEach((option, index) => {
      option.disabled =
        index === currentEvaluationIndex ||
        index < currentEvaluationIndex - 1 ||
        index > currentEvaluationIndex + 1 ||
        // If we are on the vote step, then we can only go back to the previous step
        (currentEvaluationStep === 'vote' ? index >= currentEvaluationIndex : false) ||
        (currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass');
    });
    return { options: _options };
  }, [proposal, hasRewards]);

  return (
    <TagSelect
      disableClearable
      wrapColumn
      includeSelectedOptions
      readOnly={readOnly}
      options={options}
      propertyValue={proposal.currentStep.id}
      onChange={(values) => {
        const evaluationId = Array.isArray(values) ? values[0] : values;
        if (evaluationId) {
          const currentEvaluationIndex = proposal.currentStep.index;
          const newEvaluationIdIndex = options.findIndex((option) => option.id === evaluationId);
          const moveForward = newEvaluationIdIndex > currentEvaluationIndex;
          // If we are moving forward then pass the current step, otherwise go back to the previous step
          onChange({
            evaluationId: moveForward ? proposal.currentStep.id : evaluationId,
            moveForward
          });
        }
      }}
    />
  );
}
