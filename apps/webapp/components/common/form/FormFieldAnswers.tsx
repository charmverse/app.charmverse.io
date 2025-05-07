import type { FormField } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Box, Chip, Stack } from '@mui/material';
import type {
  SelectOptionType,
  ProjectFieldValue,
  FormFieldValue,
  FieldAnswerInput
} from '@packages/lib/proposals/forms/interfaces';
import { useCallback, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, UseFormGetFieldState } from 'react-hook-form';

import type { ProposalRewardsTableProps } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadWithComments } from '@packages/lib/threads/interfaces';

import { hoverIconsStyle } from '../Icons/hoverIconsStyle';
import { ProjectFieldAnswer } from '../ProjectForm/components/ProjectField/ProjectFieldAnswer';

import { fieldTypePlaceholderRecord } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import { FieldWrapper } from './fields/FieldWrapper';
import { isWalletConfig } from './fields/utils';
import { FormFieldAnswerComment } from './FormFieldAnswerComment';

const FormFieldAnswersContainer = styled(Stack)`
  gap: ${(props) => props.theme.spacing(1)};
  flex-direction: column;
`;

type FormFieldAnswersProps = {
  formFields?: (Pick<FormField, 'type' | 'name' | 'required' | 'id' | 'description' | 'private' | 'fieldConfig'> & {
    value?: FormFieldValue;
    options?: SelectOptionType[];
    formFieldAnswerId?: string | null;
  })[];
  disabled?: boolean;
  enableComments: boolean;
  // errors: FieldErrors<Record<string, FormFieldValue>>;
  getFieldState: UseFormGetFieldState<Record<string, FormFieldValue>>;
  control: Control<Record<string, FormFieldValue>, any>;
  // onFormChange: (
  //   updatedFields: {
  //     id: string;
  //     value: FormFieldValue;
  //   }[]
  // ) => void;
  onSave?: (answers: { id: string; value: FormFieldValue }[]) => Promise<void>;
  getValues?: () => Record<string, FormFieldValue>;
  values?: Record<string, FormFieldValue>;
  pageId?: string;
  isDraft?: boolean;
  isAuthor: boolean;
  threads?: Record<string, ThreadWithComments | undefined>;
  projectId?: string | null;
  proposalId: string;
  milestoneProps?: ProposalRewardsTableProps;
  applyProject: (project: ProjectWithMembers, selectedMemberIds: string[]) => void;
  applyProjectMembers: (projectMembers: ProjectWithMembers['projectMembers']) => void;
};

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()};
  flex-direction: row;
  align-items: center;
  gap: ${(props) => props.theme.spacing(1)};
  position: relative;
`;

export function FormFieldAnswers({
  onSave,
  formFields,
  disabled,
  isAuthor,
  enableComments,
  getFieldState,
  control,
  pageId,
  projectId,
  threads = {},
  proposalId,
  milestoneProps,
  applyProject,
  applyProjectMembers
}: FormFieldAnswersProps) {
  const { user } = useUser();
  const { showMessage } = useSnackbar();

  const saveFormFieldAnswers = useCallback(
    async (answer: { id: string; value: FormFieldValue }) => {
      if (onSave && !disabled) {
        try {
          await onSave([answer]);
        } catch (e: any) {
          showMessage(e.message, 'error');
        }
      }
    },
    [showMessage, onSave, disabled]
  );

  const fieldAnswerIdThreadRecord: Record<string, ThreadWithComments[]> = useMemo(() => {
    if (!threads) {
      return {};
    }

    return Object.values(threads).reduce(
      (acc, thread) => {
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
      },
      {} as Record<string, ThreadWithComments[]>
    );
  }, [threads]);
  return (
    <FormFieldAnswersContainer>
      {formFields?.map((formField) => {
        const fieldAnswerThreads =
          (formField.formFieldAnswerId ? fieldAnswerIdThreadRecord[formField.formFieldAnswerId] : []) ?? [];
        return (
          <StyledStack
            key={formField.id}
            className='proposal-form-field-answer'
            data-thread-ids={fieldAnswerThreads.map((fieldAnswerThread) => fieldAnswerThread.id).join(',')}
          >
            <Controller
              name={formField.id}
              control={control}
              render={({ field, fieldState: { error } }) => {
                return formField.type === 'project_profile' ? (
                  <FieldWrapper required label='Project'>
                    <ProjectFieldAnswer
                      disabled={disabled}
                      applyProject={applyProject}
                      applyProjectMembers={applyProjectMembers}
                      proposalId={proposalId!}
                      formFieldId={formField.id}
                      formFieldValue={field.value as ProjectFieldValue}
                      getFieldState={getFieldState}
                      fieldConfig={formField.fieldConfig as ProjectAndMembersFieldConfig}
                      onChange={field.onChange}
                      onChangeDebounced={saveFormFieldAnswers}
                      inputEndAdornment={
                        pageId &&
                        formField.formFieldAnswerId &&
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
                              formFieldAnswerId={formField.formFieldAnswerId}
                              pageId={pageId}
                              formFieldName='Project profile'
                              disabled={disabled}
                              fieldAnswerThreads={fieldAnswerThreads}
                              enableComments={enableComments}
                            />
                          </Box>
                        )
                      }
                      projectId={projectId}
                    />
                  </FieldWrapper>
                ) : (
                  <FieldTypeRenderer
                    {...field}
                    formFieldId={formField.id}
                    getFieldState={getFieldState}
                    rows={undefined}
                    maxRows={10}
                    sx={{ mb: 2 }}
                    value={(field.value ?? '') as FormFieldValue}
                    placeholder={fieldTypePlaceholderRecord[formField.type]}
                    labelEndAdornment={
                      formField.private ? <Chip sx={{ ml: 1 }} label='Private' size='small' /> : undefined
                    }
                    walletInputConfig={
                      isWalletConfig(formField.fieldConfig) && formField.fieldConfig.chainId
                        ? {
                            chainId: formField.fieldConfig.chainId
                          }
                        : undefined
                    }
                    milestoneProps={milestoneProps}
                    inputEndAdornment={
                      pageId &&
                      formField.type !== 'label' &&
                      formField.formFieldAnswerId &&
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
                            formFieldAnswerId={formField.formFieldAnswerId}
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
                    disabled={disabled || (!isAuthor && formField.type === 'optimism_project_profile')}
                    type={formField.type === 'short_text' ? 'text_multiline' : formField.type}
                    label={formField.name}
                    options={formField.options as SelectOptionType[]}
                    error={error ? error?.message || 'invalid input' : ''}
                    required={formField.required}
                    data-test={`form-field-input-${formField.id}`}
                    onChange={field.onChange}
                    onChangeDebounced={saveFormFieldAnswers}
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
