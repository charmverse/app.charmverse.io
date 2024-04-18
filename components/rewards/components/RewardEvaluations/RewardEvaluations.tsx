import type { RewardWithUsers } from 'lib/rewards/interfaces';

import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = {
  reward?: Partial<Pick<RewardWithUsers, 'assignedSubmitters' | 'approveSubmitters'>>;
  readOnly?: boolean;
  expanded?: boolean;
};

export function RewardEvaluations({ reward, readOnly, expanded = true }: RewardEvaluationsProps) {
  const isNotNewReward = !!reward;
  return (
    <EvaluationsSettings
      reward={reward}
      readOnly={readOnly}
      requireWorkflowChangeConfirmation={isNotNewReward}
      expanded={expanded}
    />
  );
}
