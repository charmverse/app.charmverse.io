import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import { DragIndicator } from '@mui/icons-material';
import { Box, Card, Typography } from '@mui/material';

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
  onRename,
  onChangeOrder,
  readOnly
}: {
  evaluation: WorkflowEvaluationJson;
  onChangeOrder: (selectedId: WorkflowEvaluationJson, targetId: WorkflowEvaluationJson) => void;
  readOnly: boolean;
} & ContextMenuProps) {
  const [, , draggableRef, draggableStyle] = useSortable('evaluation_row', evaluation, !readOnly, onChangeOrder);

  return (
    <StyledCard style={draggableStyle} variant='outlined' ref={draggableRef} sx={{ mb: 1 }} readOnly={readOnly}>
      <Box p={1} display='flex' alignItems='center' gap={1} justifyContent='space-between'>
        {!readOnly && <DragIndicator className='show-on-hover' color='secondary' fontSize='small' />}
        {evaluationIcons[evaluation.type]()}
        <Typography sx={{ flexGrow: 1 }}>{evaluation.title}</Typography>
        <EvaluationContextMenu
          evaluation={evaluation}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
          readOnly={readOnly}
        />
      </Box>
    </StyledCard>
  );
}
