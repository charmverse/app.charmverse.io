import type { FormField } from '@charmverse/core/prisma-client';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldAnswers } from 'components/common/form/FormFieldAnswers';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FormFieldValue } from 'components/common/form/interfaces';
import type { ThreadWithComments } from 'lib/threads/interfaces';
import { isTruthy } from 'lib/utils/types';

export function ProposalFormFieldAnswers({
  proposalId,
  formFields,
  enableComments,
  readOnly,
  pageId,
  threads,
  isDraft
}: {
  readOnly?: boolean;
  enableComments: boolean;
  proposalId: string;
  formFields: FormField[];
  pageId: string;
  threads: Record<string, ThreadWithComments | undefined>;
  isDraft?: boolean;
}) {
  const { data: proposalFormFieldAnswers = [], isLoading } = useGetProposalFormFieldAnswers({ proposalId });
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId });

  const fields = formFields
    .map((formField) => {
      const proposalFormFieldAnswer = proposalFormFieldAnswers.find(
        (_proposalFormFieldAnswer) => _proposalFormFieldAnswer.fieldId === formField.id
      );
      return {
        ...formField,
        formFieldAnswer: proposalFormFieldAnswer,
        value: proposalFormFieldAnswer?.value as FormFieldValue,
        options: (formField.options ?? []) as SelectOptionType[]
      };
    })
    .filter(isTruthy);
  const { control, errors, onFormChange, values } = useFormFields({ fields });

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
    <FormFieldAnswers
      enableComments={enableComments}
      formFields={fields}
      onSave={onSave}
      pageId={pageId}
      disabled={readOnly}
      threads={threads}
      isDraft={isDraft}
      control={control}
      errors={errors}
      onFormChange={onFormChange}
      values={values}
    />
  );
}
