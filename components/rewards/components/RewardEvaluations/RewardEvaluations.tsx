import type { PageWithContent } from 'lib/pages/interfaces';
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
  page?: PageWithContent;
  refreshPage?: VoidFunction;
};

export function RewardEvaluations({
  rewardInput,
  page,
  readOnly,
  expanded = true,
  onChangeReward,
  onChangeWorkflow,
  isUnpublishedReward,
  reward,
  application,
  isTemplate,
  refreshApplication,
  refreshPage
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
  } else if (reward && page) {
    return (
      <EvaluationsReview
        page={page}
        application={application}
        expanded={expanded}
        readOnly={readOnly}
        reward={reward}
        onChangeReward={onChangeReward}
        refreshApplication={refreshApplication}
        refreshPage={refreshPage}
      />
    );
  }

  return null;
}
