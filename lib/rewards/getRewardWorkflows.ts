const rewardSubmitEvaluation = {
  id: 'submit',
  title: 'Submit',
  type: 'submit'
} as const;

const rewardReviewEvaluation = {
  id: 'review',
  title: 'Review',
  type: 'review'
} as const;

const rewardPaymentEvaluation = {
  id: 'payment',
  title: 'Payment',
  type: 'payment'
} as const;

const rewardApplyEvaluation = {
  id: 'apply',
  title: 'Apply',
  type: 'apply'
} as const;

const rewardApplicationReviewEvaluation = {
  id: 'application_review',
  title: 'Application Review',
  type: 'application_review'
} as const;

const rewardCredentialEvaluation = {
  id: 'credential',
  title: 'Credentials',
  type: 'credential'
} as const;

export type RewardEvaluation = (
  | typeof rewardSubmitEvaluation
  | typeof rewardReviewEvaluation
  | typeof rewardPaymentEvaluation
  | typeof rewardApplyEvaluation
  | typeof rewardApplicationReviewEvaluation
  | typeof rewardCredentialEvaluation
) & {
  result?: 'pass' | 'fail' | null;
};

export type RewardWorkflow = {
  id: 'direct_submission' | 'application_required' | 'assigned';
  title: string;
  evaluations: RewardEvaluation[];
};

export function getRewardWorkflows(spaceId: string): RewardWorkflow[] {
  const rewardWorkflows = [
    {
      id: 'direct_submission',
      title: 'Direct Submission',
      evaluations: [rewardSubmitEvaluation, rewardReviewEvaluation, rewardCredentialEvaluation, rewardPaymentEvaluation]
    },
    {
      id: 'application_required',
      title: 'Application Required',
      evaluations: [
        rewardApplyEvaluation,
        rewardApplicationReviewEvaluation,
        rewardSubmitEvaluation,
        rewardReviewEvaluation,
        rewardCredentialEvaluation,
        rewardPaymentEvaluation
      ]
    },
    {
      id: 'assigned',
      title: 'Assigned',
      evaluations: [rewardSubmitEvaluation, rewardReviewEvaluation, rewardCredentialEvaluation, rewardPaymentEvaluation]
    }
  ] as RewardWorkflow[];

  return rewardWorkflows;
}
