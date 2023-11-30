import { ProposalEvaluationType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { DragIndicator } from '@mui/icons-material';
import { Box, Card, IconButton, Typography } from '@mui/material';

import { useSortable } from 'components/common/BoardEditor/focalboard/src/hooks/sortable';
import type { EvaluationTemplate } from 'lib/proposal/workflows/interfaces';

import type { ContextMenuProps } from './EvaluationContextMenu';
import { EvaluationContextMenu } from './EvaluationContextMenu';

const DragIcon = styled(IconButton)`
  cursor: grab;
`;

const friendlyTypes = {
  [ProposalEvaluationType.vote]: 'Vote',
  [ProposalEvaluationType.rubric]: 'Rubric',
  [ProposalEvaluationType.pass_fail]: 'Pass/Fail'
};

export function EvaluationRow({
  key,
  evaluation,
  onDelete,
  onDuplicate,
  onRename,
  onChangeOrder,
  readOnly
}: {
  key: string;
  evaluation: EvaluationTemplate;
  onChangeOrder: (selectedId: string, targetId: string) => void;
  readOnly: boolean;
} & ContextMenuProps) {
  const dragKey = `evaluationItem-${key}`;
  const [, , draggableRef, draggableStyle] = useSortable('view', dragKey, !readOnly, onChangeOrder);

  return (
    <Card style={draggableStyle} variant='outlined' ref={draggableRef} sx={{ mb: 1 }}>
      <Box p={1} display='flex' alignItems='center' gap={1} justifyContent='space-between'>
        <DragIcon size='small'>
          <DragIndicator color='secondary' fontSize='small' />
        </DragIcon>
        <Typography sx={{ flexGrow: 1 }}>
          {evaluation.title} <em>({friendlyTypes[evaluation.type]})</em>
        </Typography>
        <EvaluationContextMenu
          evaluation={evaluation}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
          readOnly={readOnly}
        />
      </Box>
    </Card>
  );
}
