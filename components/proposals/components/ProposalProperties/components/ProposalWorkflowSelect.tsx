import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { useState } from 'react';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type Props = {
  onChange: (value: ProposalWorkflowTyped) => void;
};

export function ProposalWorkflowSelect({ onChange }: Props) {
  const [workflowId, setWorkflowId] = useState('');
  const { space: currentSpace } = useCurrentSpace();
  const { data: options } = useGetProposalWorkflows(currentSpace?.id);
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
        setWorkflowId(option.id);
        onChange(option);
      }
    }
  }
  return (
    <TagSelect
      disableClearable
      wrapColumn
      options={propertyOptions}
      propertyValue={workflowId}
      onChange={onValueChange}
    />
  );
}
