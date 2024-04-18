import type { BountyStatus } from '@charmverse/core/prisma-client';

import { useIsAdmin } from 'hooks/useIsAdmin';
import type { RewardInput } from 'lib/rewards/getRewardWorkflow';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

import { PaymentStepSettings } from './PaymentSettings';
import { ReviewStepSettings } from './ReviewSettings';
import { SubmitStepSettings } from './SubmitSettings';

export type EvaluationStepSettingsProps = {
  evaluation: RewardEvaluation;
  onChange: (updatedReward: UpdateableRewardFields) => void;
  readOnly?: boolean;
  reward?: RewardInput;
  rewardStatus?: BountyStatus | null;
};

export function EvaluationStepSettings({
  evaluation,
  rewardStatus,
  onChange,
  readOnly: _readOnly,
  reward
}: EvaluationStepSettingsProps) {
  const isAdmin = useIsAdmin();
  const readOnly = _readOnly || !isAdmin;

  if (evaluation.type === 'submit') {
    return <SubmitStepSettings onChange={onChange} readOnly={readOnly} reward={reward} />;
  } else if (evaluation.type === 'review') {
    return <ReviewStepSettings onChange={onChange} readOnly={readOnly} reward={reward} />;
  } else if (evaluation.type === 'payment') {
    return <PaymentStepSettings onChange={onChange} rewardStatus={rewardStatus} readOnly={readOnly} reward={reward} />;
  }

  return null;
}
