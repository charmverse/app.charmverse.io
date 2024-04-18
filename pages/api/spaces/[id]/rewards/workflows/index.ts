import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/middleware/handler';
import { withSessionRoute } from 'lib/session/withSession';

const handler = defaultHandler();

const rewardSubmitEvaluation = {
  id: 'submit',
  title: 'Submit',
  type: 'submit'
};

const rewardReviewEvaluation = {
  id: 'review',
  title: 'Review',
  type: 'review'
};

const rewardPaymentEvaluation = {
  id: 'payment',
  title: 'Payment',
  type: 'payment'
};

const rewardApplyEvaluation = {
  id: 'apply',
  title: 'Apply',
  type: 'apply'
};

const rewardApplicationReviewEvaluation = {
  id: 'application_review',
  title: 'Application Review',
  type: 'application_review'
};

export type RewardEvaluation = {
  id: string;
  title: string;
  type: 'submit' | 'review' | 'payment' | 'apply' | 'application_review';
  result?: 'pass' | 'fail' | null;
};

export type RewardWorkflow = {
  id: 'direct_submission' | 'application_required' | 'assigned';
  title: string;
  evaluations: RewardEvaluation[];
};

const workflows = [
  {
    id: 'direct_submission',
    title: 'Direct Submission',
    evaluations: [rewardSubmitEvaluation, rewardReviewEvaluation, rewardPaymentEvaluation]
  },
  {
    id: 'application_required',
    title: 'Application Required',
    evaluations: [
      rewardApplyEvaluation,
      rewardApplicationReviewEvaluation,
      rewardSubmitEvaluation,
      rewardReviewEvaluation,
      rewardPaymentEvaluation
    ]
  },
  {
    id: 'assigned',
    title: 'Assigned',
    evaluations: [rewardSubmitEvaluation, rewardReviewEvaluation, rewardPaymentEvaluation]
  }
] as RewardWorkflow[];

handler.get(getWorkflowsController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<RewardWorkflow[]>) {
  const spaceId = req.query.id as string;
  return res.status(200).json(workflows);
}

export default withSessionRoute(handler);
