import type { FormField } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Box, Chip, Stack } from '@mui/material';
import { Controller } from 'react-hook-form';

import { Button } from '../Button';

import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import { useFormFields } from './hooks/useFormFields';

interface TFormFieldInput {
  id: string;
  value: string | string[];
}

const FormFieldInputsContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
`;

export function FormFieldInputs({
  formFields,
  onSave
}: {
  formFields: (Pick<FormField, 'type' | 'name' | 'required' | 'options' | 'id' | 'description' | 'private'> & {
    value: string | string[];
  })[];
  onSave?: (formFieldInputs: TFormFieldInput[]) => void;
}) {
  const { control, errors, isValid, isDirty, isSubmitting, onFormChange, onSubmit } = useFormFields({
    fields: formFields,
    onSubmit: (_values) => {
      onSave?.(Object.entries(_values).map(([id, value]) => ({ id, value })));
    }
  });

  return (
    <FormFieldInputsContainer>
      <Box display='flex' flexDirection='column' gap={1}>
        {formFields.map((formField) => (
          <Controller
            key={formField.id}
            name={formField.id}
            control={control}
            render={({ field }) => (
              <FieldTypeRenderer
                {...field}
                endAdornment={formField.private ? <Chip sx={{ ml: 1 }} label='Private' size='small' /> : undefined}
                description={formField.description ?? ''}
                disabled={!onSave}
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
      </Box>
      {onSave && (
        <Stack
          alignSelf='flex-end'
          sx={{
            width: 'fit-content'
          }}
        >
          <Button
            disabled={!isValid || !isDirty || isSubmitting}
            primary
            loading={isSubmitting}
            onClick={onSubmit}
            disabledTooltip={!isValid ? 'Please fill all required fields' : !isDirty ? 'No changes to save' : undefined}
          >
            Save
          </Button>
        </Stack>
      )}
    </FormFieldInputsContainer>
  );
}
