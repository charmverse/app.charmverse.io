import AddIcon from '@mui/icons-material/Add';
import { Stack } from '@mui/material';
import { v4 } from 'uuid';

import { emptyDocument } from 'lib/prosemirror/constants';

import { Button } from '../Button';

import type { SelectOptionType } from './fields/Select/interfaces';
import { FormField } from './FormField';
import type { FormFieldInput } from './interfaces';

export function FormFieldsEditor({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse
}: {
  formFields: FormFieldInput[];
  setFormFields: (newFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
}) {
  function updateFormField(
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    > & {
      id: string;
    }
  ) {
    const updatedFieldIndex = formFields.findIndex((f) => f.id === updatedFormField.id);
    const newFormFields = [...formFields];
    // If the index was changed, we need to move the form field to the new index
    const newIndex = updatedFormField.index;
    if (typeof newIndex === 'number') {
      newFormFields.splice(newIndex, 0, newFormFields.splice(updatedFieldIndex, 1)[0]);
    }
    setFormFields(
      newFormFields.map((formField, index) => ({
        ...formField,
        ...(index === (newIndex ?? updatedFieldIndex) ? updatedFormField : {}),
        index
      }))
    );
  }

  function addNewFormField() {
    const fieldId = v4();
    setFormFields([
      ...formFields,
      {
        type: 'short_text',
        name: 'Title',
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

  return (
    <Stack gap={1}>
      {formFields.map((formField) => (
        <FormField
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
      <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<AddIcon fontSize='small' />}
        variant='text'
        size='small'
        color='secondary'
        onClick={addNewFormField}
      >
        Add an input
      </Button>
    </Stack>
  );
}
