import type { ProposalEvaluationResultExtended, ProposalEvaluationStatus, ProposalEvaluationStep } from './interfaces';

export function getProposalEvaluationStatus({
  step,
  result
}: {
  step: ProposalEvaluationStep;
  result: ProposalEvaluationResultExtended | 'archived';
}): ProposalEvaluationStatus {
  if (result === 'archived') {
    return 'archived';
  } else if (step === 'draft') {
    return 'draft';
  } else if (step === 'feedback') {
    return result === 'in_progress' ? 'in_progress' : 'passed';
  } else if (step === 'pass_fail' || step === 'rubric' || step === 'vote') {
    if (result === 'in_progress') {
      return 'in_progress';
    } else if (result === 'fail') {
      return 'declined';
    } else if (result === 'pass') {
      return 'passed';
    }
  } else if (step === 'rewards') {
    return result === 'in_progress' ? 'unpublished' : 'published';
  } else if (step === 'credentials') {
    return result === 'in_progress' ? 'not_issued' : 'issued';
  }

  return 'in_progress';
}
