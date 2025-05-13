import type { PageWithContent } from 'lib/pages/interfaces';
import type { ApplicationWithTransactions, RewardWithUsers } from '@packages/lib/rewards/interfaces';

import { EvaluationsReview } from './components/Review/EvaluationsReview';
import type { EvaluationSettingsProps } from './components/Settings/EvaluationsSettings';
import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = Pick<
  EvaluationSettingsProps,
  'rewardInput' | 'onChangeReward' | 'onChangeWorkflow' // | 'onChangeTemplate'
> & {
  expanded?: boolean;
  isUnpublishedReward?: boolean;
  templateId?: string | null;
  reward?: RewardWithUsers;
  application?: ApplicationWithTransactions;
  isTemplate?: boolean;
  refreshApplication?: VoidFunction;
  readOnly?: boolean;
  isDraft?: boolean;
  page?: PageWithContent;
  refreshReward?: VoidFunction;
  isNewApplication?: boolean;
};

export function RewardEvaluations({
  rewardInput,
  page,
  templateId,
  expanded = true,
  onChangeReward,
  onChangeWorkflow,
  isUnpublishedReward,
  readOnly,
  reward,
  application,
  isTemplate,
  refreshApplication,
  isDraft,
  refreshReward,
  isNewApplication
}: RewardEvaluationsProps) {
  if (isDraft || isUnpublishedReward || isTemplate) {
    return (
      <EvaluationsSettings
        rewardInput={rewardInput}
        isTemplate={!!isTemplate}
        templateId={templateId}
        readOnly={!!readOnly}
        expanded={expanded}
        onChangeWorkflow={onChangeWorkflow}
        onChangeReward={onChangeReward}
        isUnpublishedReward={isUnpublishedReward}
      />
    );
  } else if (reward && page) {
    return (
      <EvaluationsReview
        page={page}
        application={application}
        expanded={expanded}
        isTemplate={!!isTemplate}
        readOnly={!!readOnly}
        templateId={templateId}
        reward={reward}
        onChangeReward={onChangeReward}
        refreshApplication={refreshApplication}
        refreshReward={refreshReward}
        isNewApplication={isNewApplication}
      />
    );
  }

  return null;
}
