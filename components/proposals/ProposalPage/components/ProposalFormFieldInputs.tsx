import type { FormField } from '@charmverse/core/prisma-client';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldInputs } from 'components/common/form/FormFieldInputs';
import type { FormFieldValue } from 'components/common/form/interfaces';
import type { ThreadWithComments } from 'lib/threads/interfaces';

export function ProposalFormFieldInputs({
  proposalId,
  formFields,
  readOnly,
  isReviewer,
  pageId,
  threads
}: {
  readOnly?: boolean;
  proposalId: string;
  formFields: FormField[];
  isReviewer: boolean;
  pageId: string;
  threads: Record<string, ThreadWithComments | undefined>;
}) {
  const { data: proposalFormFieldAnswers = [], isLoading } = useGetProposalFormFieldAnswers({ proposalId });
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId });
  const onSave = async (answers: { id: string; value: FormFieldValue }[]) => {
    await trigger({
      answers: answers.map((answer) => {
        return {
          fieldId: answer.id,
          value: answer.value,
          id: proposalFormFieldAnswers.find((proposalFormFieldAnswer) => proposalFormFieldAnswer.id === answer.id)?.id
        };
      })
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <FormFieldInputs
      isReviewer={isReviewer}
      onSave={onSave}
      pageId={pageId}
      disabled={readOnly}
      threads={threads}
      formFields={formFields.map((formField) => {
        const proposalFormFieldAnswer = proposalFormFieldAnswers.find(
          (_proposalFormFieldAnswer) => _proposalFormFieldAnswer.fieldId === formField.id
        );
        return {
          ...formField,
          formFieldAnswerId: proposalFormFieldAnswer?.id,
          value: proposalFormFieldAnswer?.value as FormFieldValue,
          options: (formField.options ?? []) as SelectOptionType[]
        };
      })}
    />
  );
}
