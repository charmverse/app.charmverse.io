import { Box } from '@mui/material';

import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyOption } from 'lib/databases/board';

type Props<Option extends { id: string; title: string }> = {
  onChange?: (value: Option) => void;
  value?: string | null;
  readOnly?: boolean;
  required?: boolean;
  requireConfirmation?: boolean;
  options: Option[];
  disableAddNew?: boolean;
};

export function WorkflowSelect<Option extends { id: string; title: string }>({
  onChange,
  value,
  options,
  readOnly,
  required,
  requireConfirmation,
  disableAddNew
}: Props<Option>) {
  const { openSettings } = useSettingsDialog();
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const propertyOptions: IPropertyOption[] = [
    ...options.map((option) => ({
      id: option.id,
      value: option.title,
      color: 'grey'
    })),
    ...(disableAddNew
      ? []
      : [
          {
            id: 'add_new',
            value: '+ Add New',
            color: 'gray',
            variant: 'plain'
          } as const
        ])
  ];

  async function changeWorkflow(newValue: string) {
    const option = options?.find(({ id }) => id === newValue);
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
