import { useMemo } from 'react';

import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { PropertyValueDisplayType } from 'components/common/DatabaseEditor/interfaces';
import type { IPropertyOption } from '@packages/databases/board';
import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';

import { useBatchUpdateProposalStatusOrStep } from '../hooks/useBatchUpdateProposalStatusOrStep';

type ProposalProp = {
  currentStep: ProposalWithUsersLite['currentStep'];
  currentEvaluationId?: ProposalWithUsersLite['currentEvaluationId'];
  evaluations: ProposalWithUsersLite['evaluations'];
  hasRewards: boolean;
  hasCredentials: boolean;
  id: string;
  archived: boolean;
};

export function ControlledProposalStepSelect(props: {
  readOnly?: boolean;
  displayType?: PropertyValueDisplayType;
  proposal: ProposalProp;
  onChange: (data: { evaluationId: string; moveForward: boolean }) => void;
}) {
  return <ProposalStepSelectBase {...props} />;
}

export function ProposalStepSelect({
  proposal,
  readOnly,
  displayType
}: {
  proposal: ProposalProp;
  readOnly: boolean;
  displayType?: PropertyValueDisplayType;
}) {
  const { updateSteps } = useBatchUpdateProposalStatusOrStep();

  function onValueChange({ evaluationId, moveForward }: { evaluationId: string; moveForward: boolean }) {
    updateSteps(
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

  return (
    <ProposalStepSelectBase
      proposal={proposal}
      onChange={onValueChange}
      readOnly={readOnly}
      displayType={displayType}
    />
  );
}

export function ProposalStepSelectBase({
  proposal,
  readOnly,
  onChange,
  displayType
}: {
  proposal: ProposalProp;
  readOnly?: boolean;
  displayType?: PropertyValueDisplayType;
  onChange: (data: { evaluationId: string; moveForward: boolean }) => void;
}) {
  const hasRewards = proposal.hasRewards;
  const hasCredentials = proposal.hasCredentials;
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationIndex = proposal.currentStep.index;
  const currentEvaluationResult = proposal.currentStep.result;
  const currentEvaluationStepRequiredReviews = proposal.currentStep.requiredReviews;
  const isCurrentEvaluationFinalStep =
    proposal.currentStep.finalStep ||
    proposal.currentStep.appealedAt ||
    proposal.currentEvaluationId === proposal.evaluations[proposal.evaluations.length - 1]?.id;

  const hasPublishedRewards = currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass';

  const { options } = useMemo(() => {
    const proposalEvaluationsMap: Record<string, ProposalWithUsersLite['evaluations'][number] | undefined> = {};
    proposal.evaluations.forEach((evaluation) => {
      proposalEvaluationsMap[evaluation.id] = evaluation;
    });

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
      ...(hasCredentials
        ? [
            {
              id: 'credentials',
              value: 'Credentials',
              color: 'gray'
            }
          ]
        : []),
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
      const evaluation = proposalEvaluationsMap[option.id];

      option.disabled =
        index === currentEvaluationIndex ||
        index < currentEvaluationIndex - 1 ||
        index > currentEvaluationIndex + 1 ||
        // Disable option if it is the final step and we are on the final step
        isCurrentEvaluationFinalStep
          ? index > currentEvaluationIndex
          : false ||
            // Disable option if it is a pass_fail step and it requires more than 1 review
            (currentEvaluationStepRequiredReviews !== 1 && index > currentEvaluationIndex) ||
            // Disable option if it is a vote step and its not in progress
            (evaluation?.type === 'vote' && evaluation?.result !== null) ||
            // If we are on the vote step, then we can only go back to the previous step
            (currentEvaluationStep === 'vote'
              ? currentEvaluationResult === 'in_progress' && index >= currentEvaluationIndex
              : false);
    });
    return { options: _options };
  }, [
    proposal,
    hasRewards,
    isCurrentEvaluationFinalStep,
    currentEvaluationStep,
    currentEvaluationIndex,
    currentEvaluationResult
  ]);

  return (
    <TagSelect
      displayType={displayType}
      disableClearable
      wrapColumn
      includeSelectedOptions
      readOnly={
        proposal.archived ||
        readOnly ||
        hasPublishedRewards ||
        (currentEvaluationStep === 'vote' && currentEvaluationResult === 'fail')
      }
      options={options}
      propertyValue={proposal.currentStep.id}
      onChange={(values) => {
        const evaluationId = Array.isArray(values) ? values[0] : values;
        if (evaluationId) {
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
