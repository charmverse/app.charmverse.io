import AddIcon from '@mui/icons-material/Add';
import { Stack } from '@mui/material';
import { useState } from 'react';

import { Button } from '../Button';

import { FormField } from './FormField';
import type { ProposalFormFieldInput } from './interfaces';

export function FormFields({ formFields: initialFormFields = [] }: { formFields?: ProposalFormFieldInput[] }) {
  const [formFields, setFormFields] = useState<
    (ProposalFormFieldInput & {
      isOpen: boolean;
    })[]
  >(initialFormFields.map((formField) => ({ ...formField, isOpen: false })));

  function updateFormField({
    index,
    updatedFormField
  }: {
    index: number;
    updatedFormField: Partial<
      ProposalFormFieldInput & {
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
          type: 'text',
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
        index: index + 1
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

  return (
    <Stack gap={1}>
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
        my={1}
      >
        Add an input
      </Button>
    </Stack>
  );
}
