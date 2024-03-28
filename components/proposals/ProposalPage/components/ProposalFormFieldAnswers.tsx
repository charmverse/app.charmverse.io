import type { FormField } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import { useGetProposalFormFieldAnswers, useUpdateProposalFormFieldAnswers } from 'charmClient/hooks/proposals';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldAnswers } from 'components/common/form/FormFieldAnswers';
import type { FormFieldValue } from 'components/common/form/interfaces';
import LoadingComponent from 'components/common/LoadingComponent';
import type { ThreadWithComments } from 'lib/threads/interfaces';

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
  formFields?: FormField[];
  pageId: string;
  threads: Record<string, ThreadWithComments | undefined>;
  isDraft?: boolean;
}) {
  const { data: proposalFormFieldAnswers = [], isLoading: isLoadingAnswers } = useGetProposalFormFieldAnswers({
    proposalId
  });
  const { trigger } = useUpdateProposalFormFieldAnswers({ proposalId });
  const { refreshProposal } = useProposal({
    proposalId
  });
  const isLoading = isLoadingAnswers || !formFields;

  const fields = useMemo(
    () =>
      !isLoading
        ? formFields.map((formField) => {
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
        : undefined,
    [formFields, isLoading, proposalFormFieldAnswers]
  );

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
    await refreshProposal();
  };

  if (isLoading) {
    return <LoadingComponent />;
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
      // This is required to reinstate the form field state after the proposal is published, necessary to show the correct project id
      key={isDraft ? 'draft' : 'published'}
    />
  );
}
