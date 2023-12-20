import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';

type Props = {
  onChange: (value: ProposalWorkflowTyped) => void;
  value?: string | null;
  options?: ProposalWorkflowTyped[];
  readOnly: boolean;
};

export function WorkflowSelect({ onChange, value, options, readOnly }: Props) {
  const propertyOptions = (options || []).map((option) => ({
    id: option.id,
    value: option.title,
    color: 'grey'
  }));

  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      const option = options?.find(({ id }) => id === newValue);
      if (option) {
        onChange(option);
      }
    }
  }
  return (
    <TagSelect
      disableClearable
      wrapColumn
      options={propertyOptions}
      propertyValue={value || ''}
      onChange={onValueChange}
      readOnly={readOnly}
    />
  );
}
