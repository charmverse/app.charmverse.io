import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

type Props = {
  onChange?: (value: ProposalWorkflowTyped) => void;
  value?: string | null;
  readOnly?: boolean;
  required?: boolean;
  requireConfirmation?: boolean;
};

export function WorkflowSelect({ onChange, value, readOnly, required, requireConfirmation }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions } = useGetProposalWorkflows(currentSpace?.id);
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const propertyOptions = (workflowOptions || []).map((option) => ({
    id: option.id,
    value: option.title,
    color: 'grey'
  }));

  async function changeWorkflow(newValue: string) {
    const option = workflowOptions?.find(({ id }) => id === newValue);
    if (option && onChange) {
      try {
        await onChange(option);
      } catch (error) {
        showMessage((error as Error).message ?? 'Something went wrong', 'error');
      }
    }
  }

  async function onConfirmValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (!newValue) {
      return;
    }
    // no confirmation needed for draft or feedback
    if (!requireConfirmation) {
      changeWorkflow(newValue);
    } else {
      const { confirmed } = await showConfirmation({
        message: 'This action will clear the setting of all steps and cannot be undone.',
        confirmButton: 'Continue'
      });
      if (confirmed) {
        changeWorkflow(newValue);
      }
    }
  }

  return (
    <Box className='CardDetail' mb={1}>
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
          onChange={onConfirmValueChange}
          readOnly={readOnly}
          fluidWidth
        />
      </Box>
    </Box>
  );
}
