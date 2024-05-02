import { checkFormFieldErrors } from 'components/common/form/checkFormFieldErrors';
import { validateAnswers } from 'lib/forms/validateAnswers';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { isTruthy } from 'lib/utils/types';

import type { CreateProposalInput, ProposalEvaluationInput } from './createProposal';

export function getProposalErrors({
  page,
  proposal,
  proposalType,
  isDraft,
  requireTemplates,
  requireMilestone
}: {
  page: Pick<CreateProposalInput['pageProps'], 'title' | 'type' | 'sourceTemplateId'> & {
    content?: any | null;
  };
  proposal: Pick<
    CreateProposalInput,
    'authors' | 'proposalTemplateId' | 'formFields' | 'evaluations' | 'formAnswers' | 'fields'
  > & {
    workflowId?: string | null;
  };
  proposalType: 'structured' | 'free_form';
  isDraft: boolean;
  requireTemplates: boolean;
  requireMilestone?: boolean;
}) {
  const errors: string[] = [];

  if (isDraft) {
    return errors;
  }
  if (!page.title?.trim()) {
    errors.push('Title is required');
  }
  if (!proposal.workflowId) {
    errors.push('Workflow is required');
  }

  // non-templates
  if (page.type === 'proposal') {
    if (requireTemplates && !proposal.proposalTemplateId && !page.sourceTemplateId) {
      errors.push('Template is required');
    }
    if (proposal.authors.length === 0) {
      errors.push('At least one author is required');
    }
    if (proposal.fields?.pendingRewards?.some((r) => r.reward.rewardType === 'token' && !r.reward.rewardAmount)) {
      errors.push('Token amount is required for milestones');
    }
  }

  if (proposalType === 'structured') {
    if (page.type === 'proposal_template') {
      // creating template - check if form fields exists
      errors.push(...[checkFormFieldErrors(proposal.formFields ?? [])].filter(isTruthy));
    } else if (proposal.formFields && proposal.formAnswers) {
      const isValid = validateAnswers(
        proposal.formAnswers || [],
        proposal.formFields.filter((formField) => formField.type !== 'milestone' && formField.type !== 'label') || []
      );
      // saving proposal - check if required answers are filled
      if (!isValid) {
        errors.push('All required fields must be answered');
      }
    }
  } else if (proposalType === 'free_form' && page.type === 'proposal_template' && checkIsContentEmpty(page.content)) {
    errors.push('Content is required for free-form proposals');
  }

  if (requireMilestone && page.type !== 'proposal_template' && proposalType === 'structured') {
    if (!proposal.fields?.pendingRewards?.length) {
      errors.push('At least one milestone is required');
    }
  }
  // check evaluation configurations
  errors.push(...proposal.evaluations.map(getEvaluationFormError).filter(isTruthy));

  return errors;
}

export function getEvaluationFormError(evaluation: ProposalEvaluationInput): string | false {
  switch (evaluation.type) {
    case 'feedback':
      return false;
    case 'rubric':
      return !evaluation.title.trim()
        ? 'Title is required for rubric criteria'
        : evaluation.reviewers.length === 0
        ? `Reviewers are required for the "${evaluation.title}" step`
        : evaluation.rubricCriteria.length === 0
        ? `At least one rubric criteria is required for the "${evaluation.title}" step`
        : evaluation.rubricCriteria.some((c) => !c.title?.trim())
        ? `Rubric criteria is missing a label in the "${evaluation.title}" step`
        : false;
    case 'pass_fail':
      return evaluation.reviewers.length === 0 ? `Reviewers are required for the "${evaluation.title}" step` : false;
    case 'vote':
      return evaluation.reviewers.length === 0
        ? `Voters are required for the "${evaluation.title}" step`
        : !evaluation.voteSettings
        ? `Vote details are required for the "${evaluation.title}" step`
        : evaluation.voteSettings.strategy === 'token'
        ? !evaluation.voteSettings.chainId || !evaluation.voteSettings.tokenAddress
          ? `Chain and token address is required for the "${evaluation.title}" step`
          : false
        : false;
    default:
      return false;
  }
}
