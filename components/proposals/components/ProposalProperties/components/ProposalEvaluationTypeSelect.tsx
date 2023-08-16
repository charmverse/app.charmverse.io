import type { ProposalEvaluationType } from '@charmverse/core/prisma';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';

type Props = {
  disabled?: boolean;
  value: ProposalEvaluationType;
  onChange: (value: ProposalEvaluationType) => void;
};

const options: IPropertyOption<ProposalEvaluationType>[] = [
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

export function ProposalEvaluationTypeSelect({ disabled, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue as ProposalEvaluationType);
    }
  }

  return <TagSelect wrapColumn readOnly={disabled} options={options} propertyValue={value} onChange={onValueChange} />;
}
