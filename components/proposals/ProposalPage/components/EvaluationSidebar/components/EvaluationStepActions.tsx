import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

import { GoBackButton } from './GoBackButton';

type Props = {
  proposalId?: string;
  permissions?: ProposalWithUsersAndRubric['permissions'];
  evaluation?: ProposalEvaluationValues;
  isPreviousStep: boolean;
  refreshProposal?: VoidFunction;
  openSettings: (evaluation: ProposalEvaluationValues) => void;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function EvaluationStepActions({
  proposalId,
  permissions,
  evaluation,
  isPreviousStep,
  openSettings,
  refreshProposal
}: Props) {
  return (
    <Box display='flex' gap={1} onClick={preventAccordionToggle}>
      {isPreviousStep && refreshProposal && proposalId && (
        <GoBackButton
          proposalId={proposalId}
          previousStep={evaluation}
          hasMovePermission={!!permissions?.move}
          onSubmit={refreshProposal}
        />
      )}

      {evaluation?.type !== 'feedback' && (
        <Tooltip
          disableInteractive
          title={!permissions?.edit ? 'You do not have permission to edit this evaluation' : 'Edit'}
        >
          <span className='show-on-hover' style={{ opacity: !evaluation ? 0 : undefined }}>
            <IconButton
              color='secondary'
              disabled={!permissions?.edit}
              size='small'
              onClick={() => evaluation && openSettings(evaluation)}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
