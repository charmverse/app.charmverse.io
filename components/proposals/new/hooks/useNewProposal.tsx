import { log } from '@charmverse/core/log';
import { useCallback, useEffect, useState } from 'react';
import { mutate } from 'swr';

import { useCreateProposal } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { RubricDataInput } from 'lib/proposal/rubric/upsertRubricCriteria';

import type { ProposalPageAndPropertiesInput } from '../NewProposalPage';

export type NewProposalInput = Partial<ProposalPageAndPropertiesInput> | null;

type Props = {
  newProposal: NewProposalInput;
};

export function useNewProposal({ newProposal }: Props) {
  const isCharmVerse = useIsCharmverseSpace();
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: createProposalTrigger, isMutating: isCreatingProposal } = useCreateProposal();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [formInputs, setFormInputsRaw] = useState<ProposalPageAndPropertiesInput>(
    emptyState({ ...newProposal, userId: user?.id })
  );

  const setFormInputs = useCallback((partialFormInputs: Partial<ProposalPageAndPropertiesInput>) => {
    setContentUpdated(true);
    setFormInputsRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
  }, []);

  const clearFormInputs = useCallback(() => {
    setFormInputs(emptyState());
    setContentUpdated(false);
  }, [setFormInputs]);

  useEffect(() => {
    setFormInputsRaw((v) => ({
      ...v,
      publishToLens: !!user?.publishToLensDefault
    }));
  }, [setFormInputs, user?.publishToLensDefault]);

  async function createProposal() {
    log.info('[user-journey] Create a proposal');
    if (formInputs.categoryId && currentSpace) {
      // TODO: put validation inside the properties form component
      try {
        formInputs.rubricCriteria.forEach((criteria) => {
          if (criteria.type === 'range') {
            if (
              (!criteria.parameters.min && criteria.parameters.min !== 0) ||
              (!criteria.parameters.max && criteria.parameters.max !== 0)
            ) {
              throw new Error('Range values are invalid');
            }
            if (criteria.parameters.min >= criteria.parameters.max) {
              throw new Error('Minimum must be less than Maximum');
            }
          }
        });
      } catch (error) {
        showMessage((error as Error).message, 'error');
        return;
      }
      await createProposalTrigger({
        authors: formInputs.authors,
        categoryId: formInputs.categoryId,
        pageProps: {
          content: formInputs.content,
          contentText: formInputs.contentText ?? '',
          title: formInputs.title,
          sourceTemplateId: formInputs.proposalTemplateId,
          headerImage: formInputs.headerImage,
          icon: formInputs.icon,
          type: formInputs.type
        },
        evaluations: formInputs.evaluations,
        evaluationType: formInputs.evaluationType,
        rubricCriteria: formInputs.rubricCriteria as RubricDataInput[],
        reviewers: formInputs.reviewers,
        spaceId: currentSpace.id,
        publishToLens: formInputs.publishToLens,
        fields: formInputs.fields
      }).catch((err: any) => {
        showMessage(err.message ?? 'Something went wrong', 'error');
        throw err;
      });

      mutate(`/api/spaces/${currentSpace.id}/proposals`);
      setContentUpdated(false);
    }
  }

  let disabledTooltip: string | undefined;
  if (!formInputs.title) {
    disabledTooltip = 'Title is required';
  }

  if (!formInputs.categoryId) {
    disabledTooltip = 'Category is required';
  }

  if (formInputs.type === 'proposal' && currentSpace?.requireProposalTemplate && !formInputs.proposalTemplateId) {
    disabledTooltip = 'Template is required';
  }

  // old evalauation logic
  if (!isCharmVerse) {
    if (formInputs.reviewers.length === 0) {
      disabledTooltip = 'Reviewers are required';
    }
  } else if (formInputs.evaluations.some((evaluation) => evaluation.type !== 'feedback' && !evaluation.reviewers)) {
    disabledTooltip = 'Reviewers are required';
  }

  return {
    formInputs,
    clearFormInputs,
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
    categoryId: null,
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    evaluationType: 'vote',
    proposalTemplateId: null,
    reviewers: [],
    evaluations: [],
    rubricCriteria: [],
    title: '',
    type: 'proposal',
    publishToLens: false,
    fields: { properties: {} },
    ...inputs,
    authors: userId ? [userId] : []
  };
}
