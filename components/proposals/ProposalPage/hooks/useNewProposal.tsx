import { log } from '@charmverse/core/log';
import { useCallback, useEffect, useState } from 'react';

import { useCreateProposal } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getProposalErrors } from 'lib/proposal/getProposalErrors';

import type { ProposalPageAndPropertiesInput } from '../NewProposalPage';

export type NewProposalInput = Partial<ProposalPageAndPropertiesInput> | null;

type Props = {
  newProposal: NewProposalInput;
};

export function useNewProposal({ newProposal }: Props) {
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: createProposalTrigger, isMutating: isCreatingProposal } = useCreateProposal();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [formInputs, setFormInputsRaw] = useState<ProposalPageAndPropertiesInput>(
    emptyState({ ...newProposal, userId: user?.id })
  );

  const setFormInputs = useCallback(
    (partialFormInputs: Partial<ProposalPageAndPropertiesInput>) => {
      setContentUpdated(true);
      setFormInputsRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
    },
    [setFormInputsRaw]
  );

  useEffect(() => {
    setFormInputs({
      publishToLens: !!user?.publishToLensDefault
    });
  }, [setFormInputs, user?.publishToLensDefault]);

  async function createProposal({ isDraft }: { isDraft?: boolean }) {
    log.info('[user-journey] Create a proposal');
    if (currentSpace) {
      const result = await createProposalTrigger({
        proposalTemplateId: formInputs.proposalTemplateId,
        authors: formInputs.authors,
        pageProps: {
          content: formInputs.content,
          contentText: formInputs.contentText ?? '',
          title: formInputs.title,
          sourceTemplateId: formInputs.proposalTemplateId,
          headerImage: formInputs.headerImage,
          icon: formInputs.icon,
          type: formInputs.type
        },
        formFields: formInputs.formFields,
        evaluations: formInputs.evaluations,
        spaceId: currentSpace.id,
        publishToLens: formInputs.publishToLens,
        fields: formInputs.fields,
        formId: formInputs.formId,
        formAnswers: formInputs.formAnswers,
        workflowId: formInputs.workflowId || undefined,
        isDraft,
        selectedCredentialTemplates: formInputs.selectedCredentialTemplates ?? []
      }).catch((err: any) => {
        showMessage(err.message ?? 'Something went wrong', 'error');
        throw err;
      });
      setContentUpdated(false);
      return result;
    }
  }

  const disabledTooltip = getProposalErrors({
    proposal: formInputs,
    requireTemplates: !!currentSpace?.requireProposalTemplate
  }).join('\n');

  return {
    formInputs,
    setFormInputs,
    createProposal,
    disabledTooltip,
    isCreatingProposal,
    contentUpdated
  };
}

function emptyState({
  userId,
  ...inputs
}: Partial<ProposalPageAndPropertiesInput> & { userId?: string } = {}): ProposalPageAndPropertiesInput {
  return {
    proposalType: 'free_form',
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    proposalTemplateId: null,
    reviewers: [],
    evaluations: [],
    title: '',
    type: 'proposal',
    publishToLens: false,
    selectedCredentialTemplates: [],
    fields: { properties: {} },
    ...inputs,
    // leave authors empty for proposals
    authors: inputs.type !== 'proposal_template' && userId ? [userId] : []
  };
}
