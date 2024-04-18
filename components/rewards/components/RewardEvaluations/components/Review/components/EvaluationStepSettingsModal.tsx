import { Box } from '@mui/material';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { getEvaluationFormError } from 'lib/rewards/getRewardErrors';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

import { EvaluationStepSettings } from '../../Settings/components/EvaluationStepSettings';

export function EvaluationStepSettingsModal({
  close,
  reward,
  saveEvaluation,
  updateEvaluation,
  evaluationInput
}: {
  evaluationInput: RewardEvaluation;
  close: VoidFunction;
  reward: RewardWithUsers;
  saveEvaluation: () => void;
  updateEvaluation: (updates: UpdateableRewardFields) => void;
}) {
  const evaluationInputError = getEvaluationFormError(evaluationInput, reward);
  return (
    <Modal open onClose={close} title={`Edit ${evaluationInput?.title}`}>
      <Box mb={1}>
        <EvaluationStepSettings
          evaluation={evaluationInput}
          readOnly={false}
          rewardInput={reward}
          rewardStatus={reward.status}
          onChange={updateEvaluation}
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
