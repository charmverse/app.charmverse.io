import { useMemo } from 'react';
import { mutate } from 'swr';

import { useGoBackToEvaluationStep, useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyOption } from 'lib/focalboard/board';
import type { CardPageProposal } from 'lib/focalboard/card';

export function ProposalStepSelectWithoutProposal({
  options,
  currentValue
}: {
  options: IPropertyOption[];
  currentValue?: string;
}) {
  return (
    <TagSelect
      wrapColumn
      includeSelectedOptions
      readOnly
      options={options}
      propertyValue={currentValue ?? ''}
      onChange={() => {}}
    />
  );
}

export function ProposalStepSelect({
  proposal,
  spaceId,
  readOnly
}: {
  proposal: CardPageProposal;
  spaceId: string;
  readOnly: boolean;
}) {
  const { trigger: updateProposalStatusOnly } = useUpdateProposalStatusOnly({ proposalId: proposal.id });
  const { trigger: goBackToEvaluationStep } = useGoBackToEvaluationStep({ proposalId: proposal.id });
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
      option.disabled = index >= currentEvaluationIndex || index < currentEvaluationIndex - 1;
    });
    return { options: _options, currentValue: _options[currentEvaluationIndex]?.id };
  }, [proposal]);

  const { showMessage } = useSnackbar();

  async function onChange(evaluationId?: string) {
    try {
      if (evaluationId !== 'draft') {
        await goBackToEvaluationStep({
          evaluationId
        });
      } else {
        await updateProposalStatusOnly({
          newStatus: 'draft'
        });
      }
      await mutate(`/api/spaces/${spaceId}/proposals`);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
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
