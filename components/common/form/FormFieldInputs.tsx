import type { FormField } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Chip, Stack } from '@mui/material';
import { Controller } from 'react-hook-form';

import type { PageContent } from 'lib/prosemirror/interfaces';

import { fieldTypePlaceholderRecord } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import { useFormFields } from './hooks/useFormFields';
import type { FormFieldValue } from './interfaces';

const FormFieldInputsContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
  flex-direction: column;
  gap: ${(props) => props.theme.spacing(1)};
`;

export function FormFieldInputs({
  formFields,
  disabled
}: {
  formFields: (Pick<FormField, 'type' | 'name' | 'required' | 'options' | 'id' | 'description' | 'private'> & {
    value: FormFieldValue;
    placeholder?: string;
  })[];
  disabled?: boolean;
}) {
  const { control, errors, onFormChange } = useFormFields({
    fields: formFields
  });

  return (
    <FormFieldInputsContainer>
      {formFields.map((formField) => (
        <Controller
          key={formField.id}
          name={formField.id}
          control={control}
          render={({ field }) => (
            <FieldTypeRenderer
              {...field}
              value={(field.value ?? '') as FormFieldValue}
              placeholder={formField.placeholder ?? fieldTypePlaceholderRecord[formField.type]}
              endAdornment={formField.private ? <Chip sx={{ ml: 1 }} label='Private' size='small' /> : undefined}
              description={formField.description as PageContent}
              disabled={disabled}
              type={formField.type}
              label={formField.name}
              options={formField.options as SelectOptionType[]}
              error={errors[formField.id] as any}
              required={formField.required}
              onChange={(e) => {
                onFormChange([
                  {
                    id: formField.id,
                    value: typeof e?.target?.value === 'string' ? e.target.value : e
                  }
                ]);
              }}
            />
          )}
        />
      ))}
    </FormFieldInputsContainer>
  );
}
