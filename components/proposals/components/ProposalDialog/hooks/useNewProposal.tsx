import { log } from '@charmverse/core/log';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';

import { useCreateProposal } from 'charmClient/hooks/proposals';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import {
  useProposalDialog,
  type ProposalPageAndPropertiesInput
} from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { RubricDataInput } from 'lib/proposal/rubric/upsertRubricCriteria';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Props = {
  newProposal?: Partial<ProposalPageAndPropertiesInput>;
};

export function useNewProposal({ newProposal }: Props) {
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { showProposal } = useProposalDialog();
  const { mutatePage } = usePages();
  const router = useRouter();
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
      const createdProposal = await createProposalTrigger({
        authors: formInputs.authors,
        categoryId: formInputs.categoryId,
        pageProps: {
          content: formInputs.content,
          contentText: formInputs.contentText ?? '',
          title: formInputs.title,
          sourceTemplateId: formInputs.proposalTemplateId,
          headerImage: formInputs.headerImage,
          icon: formInputs.icon
        },
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

      if (createdProposal) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { proposal, ...page } = createdProposal;
        mutatePage(page);
        mutate(`/api/spaces/${currentSpace.id}/proposals`);
        showProposal({
          pageId: page.id,
          onClose() {
            setUrlWithoutRerender(router.pathname, { id: null });
          }
        });
        setUrlWithoutRerender(router.pathname, { id: page.id });
        setContentUpdated(false);
      }
    }
  }

  const disabledTooltip = useMemo(() => {
    if (!formInputs.title) {
      return 'Title is required';
    }

    if (!formInputs.categoryId) {
      return 'Category is required';
    }

    if (currentSpace?.requireProposalTemplate && !formInputs.proposalTemplateId) {
      return 'Template is required';
    }

    if (formInputs.reviewers.length === 0) {
      return 'Reviewers are required';
    }
  }, [
    currentSpace?.requireProposalTemplate,
    formInputs.categoryId,
    formInputs.proposalTemplateId,
    formInputs.reviewers.length,
    formInputs.title
  ]);

  return {
    formInputs,
    setFormInputs,
    clearFormInputs,
    createProposal,
    disabledTooltip,
    isCreatingProposal,
    contentUpdated
  };
}

export function emptyState({
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
    rubricCriteria: [],
    title: '',
    publishToLens: false,
    fields: { properties: {} },
    ...inputs,
    authors: userId ? [userId] : []
  };
}
