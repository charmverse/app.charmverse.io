import { checkFormFieldErrors } from 'components/common/form/checkFormFieldErrors';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { isTruthy } from 'lib/utilities/types';

import type { CreateProposalInput, ProposalEvaluationInput } from './createProposal';

export function getProposalErrors({
  proposal,
  requireTemplates
}: {
  proposal: Pick<CreateProposalInput, 'authors' | 'proposalTemplateId' | 'formFields' | 'evaluations'> &
    Pick<CreateProposalInput['pageProps'], 'title' | 'type'> & {
      content?: any | null;
      proposalType: 'structured' | 'free_form';
    };
  requireTemplates?: boolean;
}) {
  const errors = [];
  if (!proposal.title) {
    errors.push('Title is required');
  }

  if (requireTemplates && proposal.type === 'proposal' && !proposal.proposalTemplateId) {
    errors.push('Template is required');
  }
  if (proposal.type === 'proposal' && proposal.authors.length === 0) {
    errors.push('At least one author is required');
  }

  if (proposal.proposalType === 'structured') {
    errors.push(checkFormFieldErrors(proposal.formFields ?? []));
  } else if (
    proposal.proposalType === 'free_form' &&
    proposal.type === 'proposal_template' &&
    checkIsContentEmpty(proposal.content)
  ) {
    errors.push('Content is required for free-form proposals');
  }

  // get the first validation error from the evaluations
  errors.push(...proposal.evaluations.map(getEvaluationFormError).filter(isTruthy));

  return errors.filter(isTruthy);
}

export function getEvaluationFormError(evaluation: ProposalEvaluationInput): string | false {
  switch (evaluation.type) {
    case 'feedback':
      return false;
    case 'rubric':
      return !evaluation.title
        ? 'Title is required for rubric criteria'
        : evaluation.reviewers.length === 0
        ? `Reviewers are required for the "${evaluation.title}" step`
        : evaluation.rubricCriteria.length === 0
        ? `At least one rubric criteria is required for the "${evaluation.title}" step`
        : false;
    case 'pass_fail':
      return evaluation.reviewers.length === 0 ? `Reviewers are required for the "${evaluation.title}" step` : false;
    case 'vote':
      return evaluation.reviewers.length === 0
        ? `Voters are required for the "${evaluation.title}" step`
        : !evaluation.voteSettings
        ? `Vote details are required for the "${evaluation.title}" step`
        : false;
    default:
      return false;
  }
}
