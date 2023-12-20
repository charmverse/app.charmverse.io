import { log } from '@charmverse/core/log';
import { useCallback, useEffect, useState } from 'react';
import { mutate } from 'swr';

import { useCreateProposal } from 'charmClient/hooks/proposals';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationSettings';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { RubricDataInput } from 'lib/proposal/rubric/upsertRubricCriteria';
import { isTruthy } from 'lib/utilities/types';

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
        formFields: formInputs.formFields,
        evaluations: formInputs.evaluations,
        evaluationType: formInputs.evaluationType,
        rubricCriteria: formInputs.rubricCriteria as RubricDataInput[],
        reviewers: formInputs.reviewers,
        spaceId: currentSpace.id,
        publishToLens: formInputs.publishToLens,
        fields: formInputs.fields,
        formAnswers: formInputs.formAnswers
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

  // old evaluation logic
  if (!isCharmVerse) {
    if (formInputs.reviewers.length === 0) {
      disabledTooltip = 'Reviewers are required';
    }
  } else if (!disabledTooltip) {
    // get the first validation error from the evaluations
    disabledTooltip = formInputs.evaluations.map(getEvaluationFormError).filter(isTruthy)[0];
  }

  if (formInputs.proposalType === 'structured') {
    if ((formInputs.formFields ?? []).length === 0) {
      disabledTooltip = 'Atleast one form field is required for structured proposals';
    } else if (formInputs.formFields?.some((formField) => !formField.name)) {
      disabledTooltip = 'All form fields must have a title';
    } else if (
      formInputs.formFields?.some(
        (formField) =>
          (formField.type === 'select' || formField.type === 'multiselect') && (formField.options ?? []).length === 0
      )
    ) {
      disabledTooltip = 'Select fields must have atleast one option';
    }
  } else if (formInputs.proposalType === 'free_form' && !formInputs.content) {
    disabledTooltip = 'Content is required for free-form proposals';
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

function getEvaluationFormError(evaluation: ProposalEvaluationValues): string | false {
  switch (evaluation.type) {
    case 'feedback':
      return false;
    case 'rubric':
      return evaluation.reviewers.length === 0
        ? 'Reviewers are required'
        : evaluation.rubricCriteria.length === 0
        ? 'Rubric criteria are required'
        : false;
    case 'pass_fail':
      return evaluation.reviewers.length === 0 ? 'Reviewers are required' : false;
    case 'vote':
      return !evaluation.voteSettings ? 'Vote details are required' : false;
    default:
      return false;
  }
}

function emptyState({
  userId,
  ...inputs
}: Partial<ProposalPageAndPropertiesInput> & { userId?: string } = {}): ProposalPageAndPropertiesInput {
  return {
    proposalType: 'free_form',
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
