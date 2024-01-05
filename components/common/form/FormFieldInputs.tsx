import type { FormField } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Chip, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { fieldTypePlaceholderRecord } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import { useFormFields } from './hooks/useFormFields';
import type { FormFieldValue } from './interfaces';

const FormFieldInputsContainer = styled(Stack)`
  gap: ${(props) => props.theme.spacing(1)};
  flex-direction: column;
`;

type FormFieldInputsProps = {
  formFields: (Pick<FormField, 'type' | 'name' | 'required' | 'id' | 'description' | 'private'> & {
    value?: FormFieldValue;
    options?: SelectOptionType[];
  })[];
  disabled?: boolean;
  errors: FieldErrors<Record<string, FormFieldValue>>;
  control: Control<Record<string, FormFieldValue>, any>;
  onFormChange: (
    updatedFields: {
      id: string;
      value: FormFieldValue;
    }[]
  ) => void;
  onSave?: (answers: { id: string; value: FormFieldValue }[]) => Promise<void>;
  values?: Record<string, FormFieldValue>;
};

export function ControlledFormFieldInputs({
  formFields,
  disabled,
  control,
  errors,
  onFormChange
}: Omit<FormFieldInputsProps, 'onSave'>) {
  return (
    <FormFieldInputsBase
      control={control}
      errors={errors}
      formFields={formFields}
      onFormChange={onFormChange}
      disabled={disabled}
    />
  );
}

export function FormFieldInputs({
  formFields,
  disabled,
  onSave
}: Omit<FormFieldInputsProps, 'control' | 'errors' | 'onFormChange'>) {
  const { control, errors, onFormChange, values } = useFormFields({
    fields: formFields
  });

  return (
    <FormFieldInputsBase
      control={control}
      errors={errors}
      formFields={formFields}
      onFormChange={onFormChange}
      disabled={disabled}
      onSave={onSave}
      values={values}
    />
  );
}

function FormFieldInputsBase({
  onSave,
  formFields,
  values,
  disabled,
  control,
  errors,
  onFormChange
}: FormFieldInputsProps) {
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { showMessage } = useSnackbar();

  const debouncedValues = useDebouncedValue(values, 300);
  const hasErrors = Object.keys(errors).length !== 0;

  async function saveFormFieldAnswers() {
    if (hasErrors) {
      showMessage('Your form contains errors and cannot be saved.', 'error');
      return;
    }

    if (!onSave || disabled || !isFormDirty) return;

    try {
      await onSave?.(Object.entries(values ?? {}).map(([id, value]) => ({ id, value })));
    } catch (e: any) {
      showMessage(e.message, 'error');
    } finally {
      setIsFormDirty(false);
    }
  }

  useEffect(() => {
    // auto-save form fields if the form is dirty and there are no errors
    if (debouncedValues) {
      saveFormFieldAnswers();
    }
  }, [debouncedValues]);

  return (
    <Stack gap={1} mb={15}>
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
                placeholder={fieldTypePlaceholderRecord[formField.type]}
                endAdornment={formField.private ? <Chip sx={{ ml: 1 }} label='Private' size='small' /> : undefined}
                description={formField.description as PageContent}
                disabled={disabled}
                type={formField.type}
                label={formField.name}
                options={formField.options as SelectOptionType[]}
                error={errors[formField.id] as any}
                required={formField.required}
                data-test={`form-field-input-${formField.id}`}
                onChange={(e) => {
                  setIsFormDirty(true);
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
    </Stack>
  );
}
