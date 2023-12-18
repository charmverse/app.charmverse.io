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
  onSave: (formFields: FormFieldInput[]) => void;
  formFields?: FormFieldInput[];
}) {
  const [formFields, setFormFields] = useState<
    (FormFieldInput & {
      isOpen: boolean;
    })[]
  >(initialFormFields.map((formField) => ({ ...formField, isOpen: false })));

  function updateFormField({
    index,
    updatedFormField
  }: {
    index: number;
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    >;
  }) {
    setFormFields((prev) => {
      const newFormFields = [...prev];
      newFormFields[index] = {
        ...newFormFields[index],
        ...updatedFormField
      };
      return newFormFields;
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
          isOpen: true
        }
      ];
    });
  }

  function duplicateFormField(index: number) {
    setFormFields((prev) => {
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

  function deleteFormField(index: number) {
    setFormFields((prev) => {
      const newFormFields = [...prev];
      newFormFields.splice(index, 1);
      return newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }));
    });
  }

  function onCreateOption(index: number, option: SelectOptionType) {
    setFormFields((prev) => {
      const newFormFields = [...prev];
      const options = newFormFields[index].options ?? [];
      options.push(option);
      return newFormFields;
    });
  }

  function onDeleteOption(index: number, option: SelectOptionType) {
    setFormFields((prev) => {
      const newFormFields = [...prev];
      const options = newFormFields[index].options ?? [];
      const newOptions = options.filter((o) => o.id !== option.id);
      newFormFields[index].options = newOptions;
      return newFormFields;
    });
  }

  function saveFormFields() {
    onSave(formFields.map(({ isOpen, ...formField }) => formField));
  }

  function onUpdateOption(index: number, option: SelectOptionType) {
    setFormFields((prev) => {
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
      {formFields.map((formField, index) => (
        <FormField
          toggleOpen={() => {
            updateFormField({ index, updatedFormField: { isOpen: !formField.isOpen } });
          }}
          isOpen={formField.isOpen}
          formField={formField}
          updateFormField={(updatedFormField) => {
            updateFormField({ index, updatedFormField });
          }}
          key={`${formField.type}-${index.toString()}`}
          onDuplicate={() => duplicateFormField(index)}
          onDelete={() => deleteFormField(index)}
          onCreateOption={(option) => {
            onCreateOption(index, option);
          }}
          onDeleteOption={(option) => {
            onDeleteOption(index, option);
          }}
          onUpdateOption={(option) => {
            onUpdateOption(index, option);
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
      {formFields.length !== 0 && (
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
