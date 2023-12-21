import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import { useUpdateProposalFormFields } from 'charmClient/hooks/proposals';
import { useSnackbar } from 'hooks/useSnackbar';
import { emptyDocument } from 'lib/prosemirror/constants';

import { Button } from '../Button';

import type { SelectOptionType } from './fields/Select/interfaces';
import { FormField } from './FormField';
import type { FormFieldInput } from './interfaces';

export function ControlledFormFieldsEditor({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse
}: {
  formFields: FormFieldInput[];
  setFormFields: (updatedFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
}) {
  return (
    <FormFieldsEditorBase
      collapsedFieldIds={collapsedFieldIds}
      formFields={formFields}
      setFormFields={setFormFields}
      toggleCollapse={toggleCollapse}
    />
  );
}

export function FormFieldsEditor({
  proposalId,
  formFields: initialFormFields,
  readOnly
}: {
  proposalId: string;
  formFields: FormFieldInput[];
  readOnly?: boolean;
}) {
  const [formFields, setFormFields] = useState([...initialFormFields]);
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>(formFields.map((field) => field.id));
  const { trigger } = useUpdateProposalFormFields({ proposalId });
  const saveFormFields = async () => {
    await trigger({ formFields });
  };

  return (
    <FormFieldsEditorBase
      collapsedFieldIds={collapsedFieldIds}
      formFields={formFields}
      onSave={saveFormFields}
      setFormFields={setFormFields}
      toggleCollapse={(fieldId) => {
        if (collapsedFieldIds.includes(fieldId)) {
          setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
        } else {
          setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
        }
      }}
      readOnly={readOnly}
    />
  );
}

function FormFieldsEditorBase({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse,
  onSave,
  readOnly
}: {
  formFields: FormFieldInput[];
  setFormFields: (updatedFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
  onSave?: VoidFunction | (() => Promise<void>);
  readOnly?: boolean;
}) {
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isUpdatingFormFields, setIsUpdatingFormFields] = useState(false);
  const { showMessage } = useSnackbar();
  // Using a ref to keep the formFields state updated, since it becomes stale inside the functions
  const formFieldsRef = useRef(formFields);

  useEffect(() => {
    formFieldsRef.current = formFields;
  }, [formFields]);

  function updateFormField(
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    > & {
      id: string;
    }
  ) {
    const newFormFields = [...formFieldsRef.current];
    const updatedFieldIndex = newFormFields.findIndex((f) => f.id === updatedFormField.id);
    const newIndex = updatedFormField.index;
    // If the index was changed, we need to move the form field to the new index
    if (typeof newIndex === 'number') {
      newFormFields.splice(newIndex, 0, newFormFields.splice(updatedFieldIndex, 1)[0]);
    }

    // Making sure that the label field is not required
    if (updatedFormField.type === 'label') {
      updatedFormField.required = false;
    }

    setFormFields(
      newFormFields.map((formField, index) => ({
        ...formField,
        ...(index === (newIndex ?? updatedFieldIndex) ? updatedFormField : {}),
        index
      }))
    );
    setIsFormDirty(true);
  }

  async function saveFormFields() {
    setIsUpdatingFormFields(true);
    try {
      await onSave?.();
      showMessage('Form fields saved successfully');
    } catch (_) {
      //
    } finally {
      setIsFormDirty(false);
      setIsUpdatingFormFields(false);
    }
  }

  function addNewFormField() {
    const fieldId = v4();
    setFormFields([
      ...formFields,
      {
        type: 'short_text',
        name: '',
        description: emptyDocument,
        index: formFields.length,
        options: [],
        private: false,
        required: true,
        id: fieldId
      }
    ]);
  }

  function duplicateFormField(fieldId: string) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    newFormFields.splice(index, 0, {
      ...newFormFields[index],
      id: v4(),
      index: index + 1,
      options: newFormFields[index].options?.map((option) => ({ ...option, id: v4() })) ?? []
    });

    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function deleteFormField(fieldId: string) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    newFormFields.splice(index, 1);
    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function onCreateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    options.push(option);
    setFormFields(newFormFields);
  }

  function onDeleteOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.filter((o) => o.id !== option.id);
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  function onUpdateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.map((o) => {
      if (o.id === option.id) {
        return option;
      }
      return o;
    });
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  const hasEmptyName = formFields.some((formField) => !formField.name);
  const hasEmptySelectOptions = formFields.some(
    (formField) =>
      (formField.type === 'select' || formField.type === 'multiselect') && (formField.options ?? []).length === 0
  );

  const saveButtonDisabledTooltip = !isFormDirty
    ? 'Please edit the form before saving'
    : hasEmptyName
    ? 'Please fill out all field names before saving'
    : formFields.length === 0
    ? 'Please add at least one field before saving'
    : hasEmptySelectOptions
    ? 'Please add at least one option to all select fields before saving'
    : undefined;

  return (
    <Stack gap={1}>
      {formFields.map((formField) => (
        <FormField
          readOnly={readOnly}
          toggleOpen={() => {
            toggleCollapse(formField.id);
          }}
          isOpen={!collapsedFieldIds.includes(formField.id)}
          formField={formField}
          updateFormField={(updatedFormField) => {
            updateFormField(updatedFormField);
          }}
          key={formField.id}
          onDuplicate={() => duplicateFormField(formField.id)}
          onDelete={() => deleteFormField(formField.id)}
          onCreateOption={(option) => {
            onCreateOption(formField.id, option);
          }}
          onDeleteOption={(option) => {
            onDeleteOption(formField.id, option);
          }}
          onUpdateOption={(option) => {
            onUpdateOption(formField.id, option);
          }}
        />
      ))}
      {!readOnly && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<AddIcon fontSize='small' />}
          variant='text'
          size='small'
          color='secondary'
          data-test='add-new-form-field-button'
          onClick={addNewFormField}
        >
          Add an input
        </Button>
      )}
      {formFields.length !== 0 && onSave && !readOnly && (
        <Box
          sx={{
            width: 'fit-content'
          }}
        >
          <Button
            data-test='form-fields-save-button'
            onClick={saveFormFields}
            disabledTooltip={saveButtonDisabledTooltip}
            loading={isUpdatingFormFields}
            disabled={!!saveButtonDisabledTooltip}
          >
            Save
          </Button>
        </Box>
      )}
    </Stack>
  );
}
