import type { BountyStatus } from '@charmverse/core/prisma-client';

import type { RewardTemplate } from 'lib/rewards/getRewardTemplate';
import type { RewardEvaluation } from 'lib/rewards/getRewardWorkflows';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { CredentialsStepSettings } from './CredentialsStepSettings';
import { PaymentStepSettings } from './PaymentStepSettings/PaymentStepSettings';
import { ReviewStepSettings } from './ReviewStepSettings';
import { SubmitStepSettings } from './SubmitStepSettings';

export type EvaluationStepSettingsProps = {
  evaluation: RewardEvaluation;
  isTemplate: boolean;
  onChange: (updatedReward: UpdateableRewardFields) => void;
  readOnly?: boolean;
  rewardInput?: UpdateableRewardFields;
  rewardTemplateInput?: RewardTemplate;
  rewardStatus?: BountyStatus | null;
};

export function EvaluationStepSettings(props: EvaluationStepSettingsProps) {
  const evaluationType = props.evaluation.type;

  if (evaluationType === 'submit') {
    return <SubmitStepSettings {...props} />;
  } else if (evaluationType === 'review' || evaluationType === 'application_review') {
    return <ReviewStepSettings {...props} />;
  } else if (evaluationType === 'credential') {
    return <CredentialsStepSettings {...props} />;
  } else if (evaluationType === 'payment') {
    return <PaymentStepSettings {...props} />;
  }

  return null;
}
