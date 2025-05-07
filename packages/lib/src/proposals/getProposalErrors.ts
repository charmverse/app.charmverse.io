import { log } from '@charmverse/core/log';
import { isTruthy } from '@packages/utils/types';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import { validateAnswers } from '@packages/lib/proposals/forms/validateAnswers';

import { checkFormFieldErrors } from 'components/common/form/checkFormFieldErrors';

import type { CreateProposalInput, ProposalEvaluationInput } from './createProposal';
import { validateProposalProject } from './validateProposalProject';

export type ProposalToErrorCheck = Pick<
  CreateProposalInput,
  'authors' | 'formFields' | 'evaluations' | 'formAnswers' | 'fields'
> & {
  workflowId: string | null;
};

export function getProposalErrors({
  page,
  proposal,
  contentType,
  isDraft,
  project,
  requireTemplates
}: {
  page: Pick<CreateProposalInput['pageProps'], 'title' | 'type' | 'sourceTemplateId'> & {
    hasContent?: boolean;
  };
  proposal: ProposalToErrorCheck;
  project?: ProjectWithMembers | null;
  contentType: 'structured' | 'free_form';
  isDraft: boolean;
  requireTemplates: boolean;
}) {
  const errors: string[] = [];

  const requireMilestone = !!proposal.formFields?.find((field) => field.type === 'milestone')?.required;

  if (isDraft) {
    return errors;
  }
  if (!page.title?.trim()) {
    errors.push('Title is required');
  }
  if (!proposal.workflowId) {
    errors.push('Workflow is required');
  }

  if (page.type === 'proposal') {
    if (requireTemplates && !page.sourceTemplateId) {
      errors.push('Template is required');
    }
    if (proposal.authors.length === 0) {
      errors.push('At least one author is required');
    }
    if (proposal.fields?.pendingRewards?.some((r) => r.reward.rewardType === 'token' && !r.reward.rewardAmount)) {
      errors.push('Token amount is required for milestones');
    }
    if (contentType === 'structured' && proposal.formFields && proposal.formAnswers) {
      const isValid = validateAnswers(proposal.formAnswers || [], proposal.formFields || []);
      // saving proposal - check if required answers are filled
      if (!isValid) {
        errors.push('All required fields must be answered');
      }
      if (requireMilestone) {
        if (!proposal.fields?.pendingRewards?.length) {
          errors.push('At least one milestone is required');
        }
      }
      if (project) {
        try {
          validateProposalProject({
            formAnswers: proposal.formAnswers,
            formFields: proposal.formFields,
            project
          });
        } catch (error) {
          // hack for now only log errors on the backend when form is submitted
          if (typeof window === 'undefined') {
            log.error(`Project profile validation failed`, {
              error,
              projectId: project.id
            });
          }
          errors.push(`Project profile validation failed`);
        }
      }
    }
  }
  // validate templates
  else if (page.type === 'proposal_template') {
    if (contentType === 'structured') {
      // creating template - check if form fields exists
      errors.push(...[checkFormFieldErrors(proposal.formFields ?? [])].filter(isTruthy));
    } else if (contentType === 'free_form' && !page.hasContent) {
      errors.push('Content is required for free-form proposals');
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
      if (evaluation.appealable && (!evaluation.appealReviewers || evaluation.appealReviewers?.length === 0)) {
        return `Appeal reviewers are required for the "${evaluation.title}" step`;
      }
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
