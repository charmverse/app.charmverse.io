import type { BountyStatus } from '@charmverse/core/prisma-client';

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
  rewardInput?: RewardInput;
  rewardStatus?: BountyStatus | null;
};

export function EvaluationStepSettings(props: EvaluationStepSettingsProps) {
  const evaluationType = props.evaluation.type;

  if (evaluationType === 'submit') {
    return <SubmitStepSettings {...props} />;
  } else if (evaluationType === 'review' || evaluationType === 'application_review') {
    return <ReviewStepSettings {...props} />;
  } else if (evaluationType === 'payment') {
    return <PaymentStepSettings {...props} />;
  }

  return null;
}
