import AddIcon from '@mui/icons-material/Add';
import { Stack } from '@mui/material';
import { useState } from 'react';

import { Button } from '../Button';

import { FormField } from './FormField';
import type { ProposalFormFieldInput } from './interfaces';

export function FormFields() {
  const [formFields, setFormFields] = useState<ProposalFormFieldInput[]>([]);

  function updateFormField({
    index,
    updatedFormField
  }: {
    index: number;
    updatedFormField: Partial<ProposalFormFieldInput>;
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
          required: true
        }
      ];
    });
  }

  return (
    <Stack gap={1}>
      {formFields.map((formField, index) => (
        <FormField
          formField={formField}
          updateFormField={(updatedFormField) => {
            updateFormField({ index, updatedFormField });
          }}
          key={`${formField.type}-${index.toString()}`}
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
