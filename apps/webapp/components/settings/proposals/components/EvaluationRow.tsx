import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { privateEvaluationSteps, type WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { DragIndicator } from '@mui/icons-material';
import { styled, Box, Card, Chip, Tooltip, Typography } from '@mui/material';

import { useSortable } from 'components/common/DatabaseEditor/hooks/sortable';

import { evaluationIcons } from '../constants';

import type { ContextMenuProps } from './EvaluationContextMenu';
import { EvaluationContextMenu } from './EvaluationContextMenu';

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'readOnly'
})<{ readOnly: boolean }>`
  ${({ readOnly }) => (readOnly ? '' : 'cursor: grab;')}
  ${({ theme }) => theme.breakpoints.up('sm')} {
    .show-on-hover {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    &:hover {
      .show-on-hover {
        opacity: 1;
      }
    }
  }
`;

export function EvaluationRow({
  evaluation,
  onDelete,
  onDuplicate,
  onEdit,
  onChangeOrder,
  readOnly,
  privateEvaluationsEnabled
}: {
  evaluation: WorkflowEvaluationJson;
  onChangeOrder: (selectedId: WorkflowEvaluationJson, targetId: WorkflowEvaluationJson) => void;
  readOnly: boolean;
  privateEvaluationsEnabled: boolean;
} & ContextMenuProps) {
  const [, , draggableRef, draggableStyle] = useSortable('evaluation_row', evaluation, !readOnly, onChangeOrder);

  return (
    <StyledCard style={draggableStyle} variant='outlined' ref={draggableRef} sx={{ mb: 1 }} readOnly={readOnly}>
      <Box p={1} display='flex' alignItems='center' gap={1} justifyContent='space-between'>
        {!readOnly && <DragIndicator className='show-on-hover' color='secondary' fontSize='small' />}
        {evaluationIcons[evaluation.type]()}
        <Typography sx={{ flexGrow: 1 }}>{evaluation.title} </Typography>
        <Box display='flex' gap={2} justifyContent='flex-end' alignItems='center'>
          {privateEvaluationsEnabled &&
            (privateEvaluationSteps.includes(evaluation.type) ||
              evaluation.type === ('private_evaluation' as ProposalEvaluationType)) && (
              <Tooltip title='This workflow uses private evaluations. Only proposal reviewers can view details for this step'>
                <Chip size='small' variant='outlined' label='Private' />
              </Tooltip>
            )}
          <EvaluationContextMenu
            evaluation={evaluation}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            readOnly={readOnly}
          />
        </Box>
      </Box>
    </StyledCard>
  );
}
