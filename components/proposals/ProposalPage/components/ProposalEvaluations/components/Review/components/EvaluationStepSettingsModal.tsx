import { Box } from '@mui/material';

import { useGetProposalTemplate } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { ProposalEvaluationInput } from 'lib/proposals/createProposal';
import { getEvaluationFormError } from 'lib/proposals/getProposalErrors';

import type { ProposalEvaluationValues } from '../../Settings/components/EvaluationStepSettings';
import { EvaluationStepSettings } from '../../Settings/components/EvaluationStepSettings';

export function EvaluationStepSettingsModal({
  close,
  evaluationInput,
  templateId,
  saveEvaluation,
  updateEvaluation,
  isAdmin
}: {
  close: VoidFunction;
  evaluationInput: ProposalEvaluationValues;
  templateId?: string | null;
  saveEvaluation: (evaluation: ProposalEvaluationValues) => void;
  updateEvaluation: (evaluation: Partial<ProposalEvaluationValues>) => void;
  isAdmin: boolean;
}) {
  const { data: proposalTemplate } = useGetProposalTemplate(templateId);
  const evaluationInputError = evaluationInput && getEvaluationFormError(evaluationInput as ProposalEvaluationInput);
  // find matching template step, and allow editing if there were no reviewers set
  const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluationInput.title);
  return (
    <Modal open onClose={close} title={`Edit ${evaluationInput?.title}`}>
      <Box mb={1}>
        <EvaluationStepSettings
          evaluation={evaluationInput}
          evaluationTemplate={matchingTemplateStep}
          readOnly={false}
          isPublishedProposal
          onChange={updateEvaluation}
        />
      </Box>
      <Box display='flex' justifyContent='flex-end' gap={1}>
        <Button color='secondary' variant='outlined' onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={!isAdmin && evaluationInputError}
          disabledTooltip={evaluationInputError}
          onClick={() => saveEvaluation(evaluationInput)}
        >
          Save
        </Button>
      </Box>
    </Modal>
  );
}
