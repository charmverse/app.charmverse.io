import type { EvaluationSettingsProps } from './components/Settings/EvaluationsSettings';
import { EvaluationsSettings } from './components/Settings/EvaluationsSettings';

export type RewardEvaluationsProps = Omit<EvaluationSettingsProps, 'requireWorkflowChangeConfirmation' | 'expanded'>;

export function RewardEvaluations({
  reward,
  readOnly,
  expanded = true,
  onChangeEvaluation,
  onChangeWorkflow
}: EvaluationSettingsProps) {
  const isNotNewReward = !!reward;
  return (
    <EvaluationsSettings
      reward={reward}
      readOnly={readOnly}
      requireWorkflowChangeConfirmation={isNotNewReward}
      expanded={expanded}
      onChangeWorkflow={onChangeWorkflow}
      onChangeEvaluation={onChangeEvaluation}
    />
  );
}
