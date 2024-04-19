import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';

import { EvaluationsReview } from './components/Review/EvaluationsReview';
import type { EvaluationSettingsProps } from './components/Settings/EvaluationsSettings';
import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = Omit<EvaluationSettingsProps, 'requireWorkflowChangeConfirmation'> & {
  isUnpublishedReward?: boolean;
  reward?: RewardWithUsers;
  application?: ApplicationWithTransactions;
  isTemplate?: boolean;
  refreshApplication?: VoidFunction;
};

export function RewardEvaluations({
  rewardInput,
  readOnly,
  expanded = true,
  onChangeReward,
  onChangeWorkflow,
  isUnpublishedReward,
  reward,
  application,
  isTemplate,
  refreshApplication
}: RewardEvaluationsProps) {
  if (isUnpublishedReward || isTemplate) {
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
      <EvaluationsReview
        application={application}
        expanded={expanded}
        readOnly={readOnly}
        reward={reward}
        onChangeReward={onChangeReward}
        refreshApplication={refreshApplication}
      />
    );
  }

  return null;
}
