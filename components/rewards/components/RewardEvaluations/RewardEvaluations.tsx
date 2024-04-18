import type { RewardWithUsers } from 'lib/rewards/interfaces';

import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = {
  reward?: Partial<Pick<RewardWithUsers, 'assignedSubmitters' | 'approveSubmitters'>>;
  templateId?: string | null;
  expanded?: boolean;
};

export function RewardEvaluations({ reward, templateId, expanded = true }: RewardEvaluationsProps) {
  const isNotNewReward = !!reward;
  return (
    <EvaluationsSettings
      reward={reward}
      templateId={templateId}
      requireWorkflowChangeConfirmation={isNotNewReward}
      expanded={expanded}
    />
  );
}
