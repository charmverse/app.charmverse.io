import { Box } from '@mui/material';

import { useGetRewardTemplate } from 'charmClient/hooks/rewards';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { RewardFields } from '@packages/lib/rewards/blocks/interfaces';
import { getEvaluationFormError } from '@packages/lib/rewards/getRewardErrors';
import type { RewardEvaluation } from '@packages/lib/rewards/getRewardWorkflows';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';

import { EvaluationStepSettings } from '../../Settings/components/EvaluationStepSettings';

export function EvaluationStepSettingsModal({
  close,
  reward,
  isTemplate,
  saveEvaluation,
  updateEvaluation,
  templateId,
  evaluationInput
}: {
  evaluationInput: RewardEvaluation;
  close: VoidFunction;
  reward: RewardWithUsers;
  isTemplate: boolean;
  saveEvaluation: () => void;
  templateId?: string | null;
  updateEvaluation: (updates: UpdateableRewardFields) => void;
}) {
  const evaluationInputError = getEvaluationFormError(evaluationInput, reward, isTemplate);
  const { data: rewardTemplate } = useGetRewardTemplate(templateId);
  return (
    <Modal open onClose={close} title={`Edit ${evaluationInput?.title}`}>
      <Box mb={2}>
        <EvaluationStepSettings
          workflowId={(reward.fields as RewardFields).workflowId}
          evaluation={evaluationInput}
          rewardTemplateInput={rewardTemplate}
          isTemplate={isTemplate}
          readOnly={false}
          rewardInput={reward}
          rewardStatus={reward.status}
          onChange={updateEvaluation}
          rewardPublished
        />
      </Box>
      <Box display='flex' justifyContent='flex-end' gap={1}>
        <Button color='secondary' variant='outlined' onClick={close}>
          Cancel
        </Button>
        <Button disabled={evaluationInputError} disabledTooltip={evaluationInputError} onClick={() => saveEvaluation()}>
          Save
        </Button>
      </Box>
    </Modal>
  );
}
