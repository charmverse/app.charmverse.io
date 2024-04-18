import type { EvaluationStepSettingsProps } from '../../Settings/components/EvaluationStepSettings';
import { SubmitStepSettings } from '../../Settings/components/SubmitSettings';

export function SubmitStepReview({ rewardInput }: Pick<EvaluationStepSettingsProps, 'rewardInput'>) {
  return <SubmitStepSettings readOnly onChange={() => {}} rewardInput={rewardInput} />;
}
