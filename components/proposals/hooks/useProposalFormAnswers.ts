import type { SelectOptionType } from '@root/lib/forms/interfaces';
import { useCallback, useMemo, useEffect } from 'react';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import { useProjectForm } from 'components/proposals/hooks/useProjectForm';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { FormFieldValue } from 'lib/forms/interfaces';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

export function useProposalFormAnswers({ proposal }: { proposal?: ProposalWithUsersAndRubric }) {
  const { data: answers, mutate: refreshProposalFormAnswers } = useGetProposalFormFieldAnswers({
    proposalId: proposal?.id
  });
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId: proposal?.id });

  // only calculate this once on load, since answers will become stale and override the formFIelds
  const formFields = useMemo(
    () =>
      answers &&
      proposal?.form?.formFields?.map((formField) => {
        const proposalFormFieldAnswer = answers.find(
          (_proposalFormFieldAnswer) => _proposalFormFieldAnswer.fieldId === formField.id
        );
        return {
          ...formField,
          // formFieldAnswer: proposalFormFieldAnswer,
          value: proposalFormFieldAnswer?.value as FormFieldValue,
          options: (formField.options ?? []) as SelectOptionType[]
        };
      }),
    [!!proposal?.form?.formFields, !!answers]
  );

  // get Answers form
  const { control, getFieldState } = useFormFields({
    fields: formFields
  });

  // get project form
  const projectField = proposal?.form?.formFields?.find((field) => field.type === 'project_profile');
  const projectAnswer = answers?.find((answer) => answer.fieldId === projectField?.id)?.value as
    | { projectId: string; selectedMemberIds: string[] }
    | undefined;
  const {
    form: projectForm,
    applyProject,
    applyProjectMembers
  } = useProjectForm({
    // initialProjectValues: proposal?.project,
    // projectId: projectAnswer?.projectId,
    // selectedMemberIds: projectAnswer?.selectedMemberIds,
    fieldConfig: projectField?.fieldConfig as ProjectAndMembersFieldConfig
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

  // apply initial values to project form
  useEffect(() => {
    if (proposal?.project && projectAnswer?.projectId === proposal.project.id) {
      applyProject(proposal.project, projectAnswer.selectedMemberIds);
    }
  }, [!!proposal, !!projectAnswer, applyProject]);

  return {
    control,
    formFields,
    refreshProposalFormAnswers,
    onSave,
    getFieldState,
    isLoadingAnswers,
    projectForm,
    applyProject,
    applyProjectMembers
  };
}
