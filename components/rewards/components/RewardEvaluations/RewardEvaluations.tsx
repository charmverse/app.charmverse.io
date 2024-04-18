import type { RewardWithUsers } from 'lib/rewards/interfaces';

import { EvaluationsReview } from './components/Review/EvaluationsReview';
import type { EvaluationSettingsProps } from './components/Settings/EvaluationsSettings';
import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = Omit<EvaluationSettingsProps, 'requireWorkflowChangeConfirmation'> & {
  isUnpublishedReward?: boolean;
  reward?: RewardWithUsers;
};

export function RewardEvaluations({
  rewardInput,
  readOnly,
  expanded = true,
  onChangeReward,
  onChangeWorkflow,
  isUnpublishedReward,
  reward
}: RewardEvaluationsProps) {
  if (isUnpublishedReward) {
    return (
      <EvaluationsSettings
        rewardInput={rewardInput}
        readOnly={readOnly}
        requireWorkflowChangeConfirmation
        expanded={expanded}
        onChangeWorkflow={onChangeWorkflow}
        onChangeReward={onChangeReward}
      />
    );
  } else if (reward) {
    return (
      <EvaluationsReview expanded={expanded} readOnly={readOnly} reward={reward} onChangeReward={onChangeReward} />
    );
  }

  return null;
}
