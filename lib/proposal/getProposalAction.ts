import type { ProposalEvaluationType } from '@charmverse/core/prisma';

export type ProposalTaskAction =
  | 'reviewed'
  | 'needs_review'
  | 'start_discussion'
  | 'vote'
  | 'start_review'
  | 'evaluation_active'
  | 'evaluation_closed';

export function getProposalAction({
  currentStep
}: {
  currentStep: ProposalEvaluationType;
  isAuthor: boolean;
  isReviewer: boolean;
}): ProposalTaskAction | null {
  if (currentStep === 'feedback') {
    return 'start_discussion';
  } else if (currentStep === 'pass_fail') {
    return 'needs_review';
  } else if (currentStep === 'rubric') {
    return 'evaluation_active';
  } else if (currentStep === 'vote') {
    return 'vote';
  }
  return null;
}
