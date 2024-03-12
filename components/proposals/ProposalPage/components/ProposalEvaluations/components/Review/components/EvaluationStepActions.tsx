import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

import { ResetResultButton } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Review/components/ResetResultButton';
import type { PopulatedEvaluation, ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

import { GoBackButton } from './GoBackButton';

type Props = {
  proposalId?: string;
  permissions?: ProposalWithUsersAndRubric['permissions'];
  evaluation?: PopulatedEvaluation;
  isPreviousStep: boolean;
  isCurrentStep: boolean;
  refreshProposal?: VoidFunction;
  openSettings?: () => void;
  archived?: boolean;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function EvaluationStepActions({
  proposalId,
  permissions,
  evaluation,
  isPreviousStep,
  isCurrentStep,
  openSettings,
  refreshProposal,
  archived
}: Props) {
  return (
    <Box display='flex' gap={1} onClick={preventAccordionToggle}>
      {isCurrentStep && !!evaluation?.result && (
        <ResetResultButton
          evaluation={evaluation}
          proposalId={proposalId}
          onSubmit={refreshProposal}
          archived={archived}
          hasMovePermission={!!permissions?.move}
        />
      )}
      {isPreviousStep && refreshProposal && proposalId && (
        <GoBackButton
          proposalId={proposalId}
          previousStep={evaluation}
          archived={archived}
          hasMovePermission={!!permissions?.move}
          onSubmit={refreshProposal}
        />
      )}

      {evaluation && !archived && (
        <Tooltip
          disableInteractive
          title={!permissions?.edit ? 'You do not have permission to edit this evaluation' : 'Edit'}
        >
          <span className='show-on-hover' style={{ opacity: !evaluation ? 0 : undefined }}>
            <IconButton color='secondary' disabled={!permissions?.edit} size='small' onClick={() => openSettings?.()}>
              <EditIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
