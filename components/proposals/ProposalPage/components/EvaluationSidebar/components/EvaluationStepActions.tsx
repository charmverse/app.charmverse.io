import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

import { Button } from 'components/common/Button';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

import { GoBackButton } from './GoBackButton';

type Props = {
  proposalId?: string;
  permissions?: any;
  evaluation?: ProposalEvaluationValues;
  isPreviousStep: boolean;
  refreshProposal?: VoidFunction;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function EvaluationStepActions({ proposalId, permissions, evaluation, isPreviousStep, refreshProposal }: Props) {
  return (
    <Box display='flex' gap={1} onClick={preventAccordionToggle}>
      {isPreviousStep && refreshProposal && proposalId && (
        <GoBackButton
          proposalId={proposalId}
          previousStep={evaluation}
          hasMovePermission={permissions.move}
          onSubmit={refreshProposal}
        />
      )}
      <Tooltip title={!permissions.edit ? 'You do not have permission to edit this evaluation' : 'Edit'}>
        <span className='show-on-hover'>
          <IconButton color='secondary' disabled={!permissions.edit} size='small'>
            <EditIcon fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
