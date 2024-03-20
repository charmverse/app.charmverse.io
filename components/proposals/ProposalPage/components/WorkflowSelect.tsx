import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box } from '@mui/material';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyOption } from 'lib/databases/board';

type Props = {
  onChange?: (value: ProposalWorkflowTyped) => void;
  value?: string | null;
  readOnly?: boolean;
  required?: boolean;
  requireConfirmation?: boolean;
};

export function WorkflowSelect({ onChange, value, readOnly, required, requireConfirmation }: Props) {
  const { openSettings } = useSettingsDialog();
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions } = useGetProposalWorkflows(currentSpace?.id);
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const propertyOptions: IPropertyOption[] = (workflowOptions || []).map((option) => ({
    id: option.id,
    value: option.title,
    color: 'grey'
  }));

  propertyOptions.push({
    id: 'add_new',
    value: '+ Add New',
    color: 'gray',
    variant: 'plain'
  });

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
    if (newValue === 'add_new') {
      openSettings('proposals');
      // open the new workflow input after the settings dialog is open
      setTimeout(() => {
        const btnElement = document.getElementById('new-workflow-btn');
        btnElement?.click();
      }, 100);
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
