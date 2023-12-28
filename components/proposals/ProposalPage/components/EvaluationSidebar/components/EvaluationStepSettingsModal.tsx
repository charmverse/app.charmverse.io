import { Box } from '@mui/material';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';

import { getEvaluationFormError } from '../../../hooks/useNewProposal';
import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';
import { EvaluationStepSettings } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

export function EvaluationStepSettingsModal({
  close,
  evaluationInput,
  isFromTemplate,
  saveEvaluation,
  updateEvaluation
}: {
  close: VoidFunction;
  evaluationInput: ProposalEvaluationValues;
  isFromTemplate: boolean;
  saveEvaluation: (evaluation: ProposalEvaluationValues) => void;
  updateEvaluation: (evaluation: Partial<ProposalEvaluationValues>) => void;
}) {
  const evaluationInputError = evaluationInput && getEvaluationFormError(evaluationInput);
  return (
    <Modal open onClose={close} title={`Edit ${evaluationInput?.title}`}>
      <Box mb={1}>
        <EvaluationStepSettings
          readOnly={false}
          readOnlyReviewers={isFromTemplate}
          readOnlyRubricCriteria={isFromTemplate}
          evaluation={evaluationInput}
          onChange={updateEvaluation}
        />
      </Box>
      <Box display='flex' justifyContent='flex-end' gap={1}>
        <Button color='secondary' variant='outlined' onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={evaluationInputError}
          disabledTooltip={evaluationInputError}
          onClick={() => saveEvaluation(evaluationInput)}
        >
          Save
        </Button>
      </Box>
    </Modal>
  );
}
