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
  isAuthor,
  currentStep,
  isReviewer
}: {
  currentStep: ProposalEvaluationType;
  isAuthor: boolean;
  isReviewer: boolean;
}): ProposalTaskAction | null {
  if (currentStep === 'feedback') {
    if (isAuthor) {
      return 'evaluation_active';
    } else if (isReviewer) {
      return 'reviewed';
    }
  } else if (currentStep === 'pass_fail') {
    if (isAuthor) {
      return 'evaluation_closed';
    } else if (isReviewer) {
      return 'needs_review';
    }
  } else if (currentStep === 'rubric') {
    if (isAuthor) {
      return 'evaluation_closed';
    } else if (isReviewer) {
      return 'start_review';
    }
  } else if (currentStep === 'vote') {
    return 'vote';
  }
  return null;
}
