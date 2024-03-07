import type { FormField } from '@charmverse/core/prisma-client';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldAnswers } from 'components/common/form/FormFieldAnswers';
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
      onSave={onSave}
      pageId={pageId}
      disabled={readOnly}
      threads={threads}
      isDraft={isDraft}
      formFields={formFields
        .map((formField) => {
          const proposalFormFieldAnswer = proposalFormFieldAnswers.find(
            (_proposalFormFieldAnswer) => _proposalFormFieldAnswer.fieldId === formField.id
          );
          if (!proposalFormFieldAnswer && formField.type !== 'label') {
            return null;
          }
          return {
            ...formField,
            formFieldAnswer: proposalFormFieldAnswer,
            value: proposalFormFieldAnswer?.value as FormFieldValue,
            options: (formField.options ?? []) as SelectOptionType[]
          };
        })
        .filter(isTruthy)}
    />
  );
}
