import type { FormField, FormFieldAnswer } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Box, Chip, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { useGetProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProjectAndMembersFieldConfig, ProjectWithMembers } from 'lib/projects/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadWithComments } from 'lib/threads/interfaces';

import { hoverIconsStyle } from '../Icons/hoverIconsStyle';

import { fieldTypePlaceholderRecord } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import { FieldWrapper } from './fields/FieldWrapper';
import { ProjectProfileInputField } from './fields/ProjectProfileInputField';
import type { SelectOptionType } from './fields/Select/interfaces';
import { FormFieldAnswerComment } from './FormFieldAnswerComment';
import { useFormFields } from './hooks/useFormFields';
import type { FormFieldValue } from './interfaces';

const FormFieldAnswersContainer = styled(Stack)`
  gap: ${(props) => props.theme.spacing(1)};
  flex-direction: column;
`;

type FormFieldAnswersProps = {
  formFields?: (Pick<FormField, 'type' | 'name' | 'required' | 'id' | 'description' | 'private' | 'fieldConfig'> & {
    value?: FormFieldValue;
    options?: SelectOptionType[];
    formFieldAnswer?: FormFieldAnswer | null;
  })[];
  disabled?: boolean;
  enableComments: boolean;
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
  pageId?: string;
  isDraft?: boolean;
  threads?: Record<string, ThreadWithComments | undefined>;
  project?: ProjectWithMembers | null;
  proposalId?: string;
};

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()};
  flex-direction: row;
  align-items: center;
  gap: ${(props) => props.theme.spacing(1)};
  position: relative;
`;

export function FormFieldAnswers(
  props: Omit<FormFieldAnswersProps, 'control' | 'errors' | 'onFormChange' | 'onProjectUpdate'>
) {
  const { control, errors, onFormChange, values } = useFormFields({
    fields: props.formFields
  });

  return (
    <FormFieldAnswersControlled
      {...props}
      control={control}
      errors={errors}
      onFormChange={onFormChange}
      values={values}
    />
  );
}

export function FormFieldAnswersControlled({
  onSave,
  formFields,
  values,
  disabled,
  enableComments,
  control,
  errors,
  onFormChange,
  pageId,
  project,
  threads = {},
  proposalId
}: FormFieldAnswersProps & {
  threads?: Record<string, ThreadWithComments | undefined>;
}) {
  const { mutate } = useGetProposalFormFieldAnswers({
    proposalId
  });
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
    <FormFieldAnswersContainer>
      {formFields?.map((formField) => {
        const fieldAnswerThreads =
          (formField.formFieldAnswer ? fieldAnswerIdThreadRecord[formField.formFieldAnswer.id] : []) ?? [];
        return (
          <StyledStack
            key={formField.id}
            className='proposal-form-field-answer'
            data-thread-ids={fieldAnswerThreads.map((fieldAnswerThread) => fieldAnswerThread.id).join(',')}
          >
            <Controller
              name={formField.id}
              control={control}
              render={({ field }) => {
                return formField.type === 'project_profile' ? (
                  <FieldWrapper required label='Project'>
                    <ProjectProfileInputField
                      disabled={disabled}
                      proposalId={proposalId}
                      formFieldValue={field.value as { selectedMemberIds: string[] }}
                      fieldConfig={formField.fieldConfig as ProjectAndMembersFieldConfig}
                      onChange={(projectFormValues) => {
                        setIsFormDirty(true);
                        onFormChange([
                          {
                            id: formField.id,
                            value: projectFormValues
                          }
                        ]);
                        mutate();
                      }}
                      inputEndAdornment={
                        pageId &&
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
                              formFieldName='Project profile'
                              disabled={disabled}
                              fieldAnswerThreads={fieldAnswerThreads}
                              enableComments={enableComments}
                            />
                          </Box>
                        )
                      }
                      project={project}
                    />
                  </FieldWrapper>
                ) : (
                  <FieldTypeRenderer
                    {...field}
                    rows={undefined}
                    maxRows={10}
                    sx={{ mb: 2 }}
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
                            enableComments={enableComments}
                          />
                        </Box>
                      )
                    }
                    description={formField.description as PageContent}
                    disabled={disabled}
                    type={formField.type === 'short_text' ? 'text_multiline' : formField.type}
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
                );
              }}
            />
          </StyledStack>
        );
      })}
    </FormFieldAnswersContainer>
  );
}
