import type { ProposalEvaluationType } from '@charmverse/core/prisma';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  value: ProposalEvaluationType;
  onChange: (value: ProposalEvaluationType) => void;
};

export const evaluationTypeOptions: IPropertyOption<ProposalEvaluationType>[] = [
  {
    id: 'rubric',
    value: 'Rubric',
    color: 'grey'
  },
  {
    id: 'vote',
    value: 'Vote',
    color: 'grey'
  }
];

export function ProposalEvaluationTypeSelect({ readOnly, readOnlyMessage, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue as ProposalEvaluationType);
    }
  }

  return (
    <TagSelect
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={evaluationTypeOptions}
      propertyValue={value}
      onChange={onValueChange}
    />
  );
}
