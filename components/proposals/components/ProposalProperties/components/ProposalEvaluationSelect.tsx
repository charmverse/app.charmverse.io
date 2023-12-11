import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Typography } from '@mui/material';
import { findIndex } from 'lodash';
import { useState } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

type Props = {
  evaluations: Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'>[];
  isDraft?: boolean;
  readOnly: boolean;
  // Note: draft is not an evaluation step
  onChange: ({ toDraft, evaluationId }: { toDraft?: boolean; evaluationId?: string }) => void;
};

export const evaluationLabels = {
  draft: 'Only authors can view and edit',
  [ProposalEvaluationType.feedback]: 'Request feedback',
  [ProposalEvaluationType.vote]: 'Evaluation by vote',
  [ProposalEvaluationType.rubric]: 'Evaluation by rubric',
  [ProposalEvaluationType.pass_fail]: 'Reviewer approval is required to proceed'
};

// allow user to change the current evaluation step
export function ProposalEvaluationSelect({ evaluations, isDraft, readOnly, onChange }: Props) {
  const [selectedChange, setSelectedChange] = useState<{ message: string; value: string } | null>(null);
  const currentEvaluation = getCurrentEvaluation(evaluations);
  const currentValue = isDraft ? 'draft' : currentEvaluation?.id;
  const currentEvaluationIndex = findIndex(evaluations, (option) => option.id === currentValue);

  const propertyOptions = [
    {
      id: 'draft',
      description: evaluationLabels.draft,
      value: 'Draft',
      color: 'grey'
    },
    ...evaluations.map((evaluation, index) => {
      let disabled = true;
      // if the current step is draft, allow user to move forward to the first step
      if (isDraft && index === 0) {
        disabled = false;
      }
      // If the current step is feedback, allow user to move forward to the next step
      if (currentEvaluation?.type === 'feedback' && currentEvaluationIndex + 1 === index) {
        disabled = false;
      }
      // Allow users to move backwards, unless there has been a vote result
      if (currentEvaluationIndex >= index) {
        const hasBlockingVoteResult = evaluations
          .slice(index, currentEvaluationIndex)
          .some((e) => e.type === 'vote' && e.result);
        if (!hasBlockingVoteResult) {
          disabled = false;
        }
      }
      return {
        id: evaluation.id,
        disabled,
        description: evaluationLabels[evaluation.type],
        value: evaluation.title,
        color: 'grey'
      };
    })
  ];

  function onSelectOption(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      const currentIndex = findIndex(propertyOptions, (option) => option.value === currentValue);
      const newIndex = findIndex(propertyOptions, (option) => option.value === newValue);
      if (newIndex > currentIndex) {
        setSelectedChange({ message: 'Are you sure you want to proceed?', value: newValue });
      } else if (newIndex < currentIndex) {
        setSelectedChange({
          message:
            'Are you sure you want to proceed? This decision may reset the result of current or previous steps and cannot be undone',
          value: newValue
        });
      }
    }
  }

  function onCancel() {
    setSelectedChange(null);
  }

  function onConfirm() {
    const newValue = selectedChange?.value;
    if (newValue === 'draft') {
      onChange({ toDraft: true });
    } else {
      onChange({ evaluationId: selectedChange?.value });
    }
    setSelectedChange(null);
  }

  return (
    <>
      <TagSelect
        disableClearable
        includeSelectedOptions
        wrapColumn
        readOnly={readOnly}
        options={propertyOptions}
        propertyValue={currentValue || ''}
        onChange={onSelectOption}
      />

      <ModalWithButtons open={!!selectedChange} buttonText='Continue' onClose={onCancel} onConfirm={onConfirm}>
        <Typography>{selectedChange?.message}</Typography>
      </ModalWithButtons>
    </>
  );
}
