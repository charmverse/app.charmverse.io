import { useCallback, useMemo } from 'react';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import { useProjectForm } from 'components/proposals/hooks/useProjectForm';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { FormFieldValue } from 'lib/forms/interfaces';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function useProposalFormAnswers({ proposal }: { proposal?: ProposalWithUsersAndRubric }) {
  const { data: answers } = useGetProposalFormFieldAnswers({
    proposalId: proposal?.id
  });
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId: proposal?.id });

  const formFields = useMemo(
    () =>
      answers &&
      proposal?.form?.formFields?.map((formField) => {
        const proposalFormFieldAnswer = answers.find(
          (_proposalFormFieldAnswer) => _proposalFormFieldAnswer.fieldId === formField.id
        );
        return {
          ...formField,
          formFieldAnswer: proposalFormFieldAnswer,
          value: proposalFormFieldAnswer?.value as FormFieldValue,
          options: (formField.options ?? []) as SelectOptionType[]
        };
      }),
    [proposal?.form?.formFields, answers]
  );

  const projectField = proposal?.form?.formFields?.find((field) => field.type === 'project_profile');
  const projectAnswer = answers?.find((answer) => answer.fieldId === projectField?.id)?.value as
    | { projectId: string; selectedMemberIds: string[] }
    | undefined;

  const { control, getFieldState } = useFormFields({
    fields: formFields
  });

  const projectForm = useProjectForm({
    initialProjectValues: proposal?.project,
    projectId: proposal?.projectId,
    selectedMemberIds: projectAnswer?.selectedMemberIds,
    fieldConfig:
      (projectField?.fieldConfig as ProjectAndMembersFieldConfig) ?? createDefaultProjectAndMembersFieldConfig()
  });

  const onSave = useCallback(
    async (_answers: { id: string; value: FormFieldValue }[]) => {
      await trigger({
        answers: _answers.map((answer) => {
          return {
            fieldId: answer.id,
            value: answer.value,
            id: answers?.find((proposalFormFieldAnswer) => proposalFormFieldAnswer.id === answer.id)?.id
          };
        })
      });
    },
    [trigger, answers]
  );

  // isLoadingAnswers is based on whether formFields has been populatd with answers yet or not
  // add a debounce delay so the state inside useFormFields has time to set the values or elsle empty fields will appear for a brief second
  const isLoadingAnswers = useDebouncedValue(!formFields, 1);

  return {
    control,
    formFields,
    onSave,
    getFieldState,
    isLoadingAnswers,
    projectForm
  };
}
