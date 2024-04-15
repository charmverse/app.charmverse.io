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
  requireTemplates
}: {
  page: Pick<CreateProposalInput['pageProps'], 'title' | 'type' | 'sourceTemplateId'> & {
    content?: any | null;
  };
  proposal: Pick<
    CreateProposalInput,
    'authors' | 'proposalTemplateId' | 'formFields' | 'evaluations' | 'formAnswers'
  > & {
    workflowId?: string | null;
  };
  proposalType: 'structured' | 'free_form';
  isDraft: boolean;
  requireTemplates: boolean;
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

  if (requireTemplates && page.type === 'proposal' && !proposal.proposalTemplateId && !page.sourceTemplateId) {
    errors.push('Template is required');
  }
  if (page.type === 'proposal' && proposal.authors.length === 0) {
    errors.push('At least one author is required');
  }

  if (proposalType === 'structured') {
    if (page.type === 'proposal_template') {
      // creating template - check if form fields exists
      errors.push(...[checkFormFieldErrors(proposal.formFields ?? [])].filter(isTruthy));
    } else if (proposal.formFields && proposal.formAnswers) {
      const isValid = validateAnswers(proposal.formAnswers || [], proposal.formFields || []);
      // saving proposal - check if required answers are filled
      if (!isValid) {
        errors.push('All required fields must be answered');
      }
    }
  } else if (proposalType === 'free_form' && page.type === 'proposal_template' && checkIsContentEmpty(page.content)) {
    errors.push('Content is required for free-form proposals');
  }
  // get the first validation error from the evaluations
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
