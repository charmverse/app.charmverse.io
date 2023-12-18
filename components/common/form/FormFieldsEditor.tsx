import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { v4 } from 'uuid';

import { Button } from '../Button';

import type { SelectOptionType } from './fields/Select/interfaces';
import { FormField } from './FormField';
import type { FormFieldInput } from './interfaces';

export function FormFieldsEditor({
  formFields: initialFormFields = [],
  onSave
}: {
  onSave?: (formFields: FormFieldInput[]) => void;
  formFields?: FormFieldInput[];
}) {
  const [formFields, setFormFields] = useState<
    (FormFieldInput & {
      isOpen: boolean;
    })[]
  >(initialFormFields.map((formField) => ({ ...formField, isOpen: false })));

  function updateFormField(
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    > & {
      id: string;
    }
  ) {
    setFormFields((prev) => {
      const updatedFieldIndex = prev.findIndex((f) => f.id === updatedFormField.id);
      const newFormFields = [...prev];
      // If the index was changed, we need to move the form field to the new index
      const newIndex = updatedFormField.index;
      if (typeof newIndex === 'number') {
        newFormFields.splice(newIndex, 0, newFormFields.splice(updatedFieldIndex, 1)[0]);
        return newFormFields.map((formField, index) => {
          if (index === newIndex) {
            return {
              ...formField,
              ...updatedFormField
            };
          }

          return {
            ...formField,
            index
          };
        });
      } else {
        newFormFields[updatedFieldIndex] = {
          ...newFormFields[updatedFieldIndex],
          ...updatedFormField
        };
        return newFormFields;
      }
    });
  }

  function addNewFormField() {
    setFormFields((prev) => {
      return [
        ...prev,
        {
          type: 'short_text',
          name: 'Title',
          description: '',
          index: prev.length,
          options: [],
          private: false,
          required: true,
          isOpen: true,
          id: v4()
        }
      ];
    });
  }

  function duplicateFormField(fieldId: string) {
    setFormFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      const newFormFields = [...prev];
      newFormFields.splice(index, 0, {
        ...newFormFields[index],
        index: index + 1,
        options: newFormFields[index].options?.map((option) => ({ ...option, id: v4() })) ?? []
      });

      return newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }));
    });
  }

  function deleteFormField(fieldId: string) {
    setFormFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      const newFormFields = [...prev];
      newFormFields.splice(index, 1);
      return newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }));
    });
  }

  function onCreateOption(fieldId: string, option: SelectOptionType) {
    setFormFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      const newFormFields = [...prev];
      const options = newFormFields[index].options ?? [];
      options.push(option);
      return newFormFields;
    });
  }

  function onDeleteOption(fieldId: string, option: SelectOptionType) {
    setFormFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      const newFormFields = [...prev];
      const options = newFormFields[index].options ?? [];
      const newOptions = options.filter((o) => o.id !== option.id);
      newFormFields[index].options = newOptions;
      return newFormFields;
    });
  }

  function saveFormFields() {
    onSave?.(formFields.map(({ isOpen, ...formField }) => formField));
  }

  function onUpdateOption(fieldId: string, option: SelectOptionType) {
    setFormFields((prev) => {
      const index = prev.findIndex((f) => f.id === fieldId);
      const newFormFields = [...prev];
      const options = newFormFields[index].options ?? [];
      const newOptions = options.map((o) => {
        if (o.id === option.id) {
          return option;
        }
        return o;
      });
      newFormFields[index].options = newOptions;
      return newFormFields;
    });
  }

  const hasEmptyName = formFields.some((formField) => !formField.name);

  return (
    <Stack p={1} gap={1}>
      {formFields.map((formField) => (
        <FormField
          toggleOpen={() => {
            updateFormField({ isOpen: !formField.isOpen, id: formField.id });
          }}
          isOpen={formField.isOpen}
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
      {formFields.length !== 0 && onSave && (
        <Box
          sx={{
            width: 'fit-content'
          }}
        >
          <Button
            onClick={saveFormFields}
            disabledTooltip={
              hasEmptyName
                ? 'Please fill out all field names before saving'
                : 'Please add at least one field before saving'
            }
            disabled={formFields.length === 0 || hasEmptyName}
          >
            Save
          </Button>
        </Box>
      )}
    </Stack>
  );
}
