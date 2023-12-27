import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box } from '@mui/material';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type Props = {
  onChange?: (value: ProposalWorkflowTyped) => void;
  value?: string | null;
  readOnly?: boolean;
  required?: boolean;
};

export function WorkflowSelect({ onChange, value, readOnly, required }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions } = useGetProposalWorkflows(currentSpace?.id);

  const propertyOptions = (workflowOptions || []).map((option) => ({
    id: option.id,
    value: option.title,
    color: 'grey'
  }));

  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      const option = workflowOptions?.find(({ id }) => id === newValue);
      if (option && onChange) {
        onChange(option);
      }
    }
  }
  return (
    <div className='CardDetail'>
      <Box className='octo-propertyrow' mb='0 !important' display='flex' justifyContent='space-between'>
        <PropertyLabel readOnly required={required} highlighted>
          Workflow
        </PropertyLabel>
        <TagSelect
          data-test='proposal-workflow-select'
          disableClearable
          wrapColumn
          options={propertyOptions}
          propertyValue={value || ''}
          onChange={onValueChange}
          readOnly={readOnly}
          fluidWidth
        />
      </Box>
    </div>
  );
}
