import type { FormField, FormFieldAnswer } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Box, Chip, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import { hoverIconsStyle } from '../Icons/hoverIconsStyle';

import { fieldTypePlaceholderRecord } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import { FormFieldAnswerComment } from './FormFieldAnswerComment';
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
    formFieldAnswer?: FormFieldAnswer | null;
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
  isReviewer: boolean;
  pageId?: string;
};

export function ControlledFormFieldInputs({
  formFields,
  disabled,
  control,
  errors,
  onFormChange
}: Omit<FormFieldInputsProps, 'onSave' | 'isReviewer'>) {
  return (
    <FormFieldInputsBase
      control={control}
      errors={errors}
      formFields={formFields}
      onFormChange={onFormChange}
      disabled={disabled}
      isReviewer={false}
    />
  );
}

export function FormFieldInputs({
  formFields,
  disabled,
  onSave,
  isReviewer,
  pageId,
  threads
}: Omit<FormFieldInputsProps, 'control' | 'errors' | 'onFormChange'> & {
  isReviewer: boolean;
  threads?: Record<string, ThreadWithComments | undefined>;
}) {
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
      isReviewer={isReviewer}
      pageId={pageId}
      threads={threads}
    />
  );
}

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()};
  flex-direction: row;
  align-items: center;
  gap: ${(props) => props.theme.spacing(1)};
  position: relative;
`;

function FormFieldInputsBase({
  onSave,
  formFields,
  values,
  disabled,
  control,
  errors,
  onFormChange,
  isReviewer,
  pageId,
  threads = {}
}: FormFieldInputsProps & {
  isReviewer: boolean;
  threads?: Record<string, ThreadWithComments | undefined>;
}) {
  const isAdmin = useIsAdmin();
  const { user } = useUser();
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

  const fieldAnswerIdThreadRecord: Record<string, ThreadWithComments[]> = useMemo(() => {
    if (!threads) {
      return {};
    }

    return Object.values(threads).reduce((acc, thread) => {
      if (!thread) {
        return acc;
      }

      const fieldAnswerId = thread.fieldAnswerId;
      if (!fieldAnswerId) {
        return acc;
      }

      if (!acc[fieldAnswerId]) {
        return {
          ...acc,
          [fieldAnswerId]: [thread]
        };
      }

      return {
        ...acc,
        [fieldAnswerId]: [...acc[fieldAnswerId], thread]
      };
    }, {} as Record<string, ThreadWithComments[]>);
  }, [threads]);

  useEffect(() => {
    // auto-save form fields if the form is dirty and there are no errors
    if (debouncedValues) {
      saveFormFieldAnswers();
    }
  }, [debouncedValues]);

  return (
    <Stack gap={1} mb={15}>
      <FormFieldInputsContainer>
        {formFields.map((formField) => {
          const fieldAnswerThreads = formField.formFieldAnswer
            ? fieldAnswerIdThreadRecord[formField.formFieldAnswer.id]
            : [];
          return (
            <StyledStack key={formField.id}>
              <Controller
                name={formField.id}
                control={control}
                render={({ field }) => (
                  <FieldTypeRenderer
                    {...field}
                    value={(field.value ?? '') as FormFieldValue}
                    placeholder={fieldTypePlaceholderRecord[formField.type]}
                    labelEndAdornment={
                      formField.private ? <Chip sx={{ ml: 1 }} label='Private' size='small' /> : undefined
                    }
                    inputEndAdornment={
                      pageId &&
                      formField.type !== 'label' &&
                      formField.formFieldAnswer &&
                      user && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '100%',
                            ml: {
                              md: 1,
                              xs: 0.5
                            }
                          }}
                        >
                          <FormFieldAnswerComment
                            formFieldAnswer={formField.formFieldAnswer}
                            pageId={pageId}
                            formFieldName={formField.name}
                            disabled={disabled}
                            fieldAnswerThreads={fieldAnswerThreads}
                            canCreateComments={isAdmin || isReviewer}
                          />
                        </Box>
                      )
                    }
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
            </StyledStack>
          );
        })}
      </FormFieldInputsContainer>
    </Stack>
  );
}
