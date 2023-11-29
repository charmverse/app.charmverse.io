import styled from '@emotion/styled';
import { DragIndicator, MoreHoriz } from '@mui/icons-material';
import { Box, Card, IconButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';

import { useSortable } from 'components/common/BoardEditor/focalboard/src/hooks/sortable';
import type { EvaluationStep } from 'lib/spaces/workflowTemplates';

const DragIcon = styled(IconButton)`
  cursor: grab;
`;

export function WorkflowEvaluationRow({
  key,
  evaluation,
  onDelete,
  onDuplicate,
  onSave,
  onChangeOrder,
  readOnly
}: {
  key: string;
  evaluation: EvaluationStep;
  onDelete: (id: string) => void;
  onDuplicate: (evaluation: EvaluationStep) => void;
  onSave: (evaluation: EvaluationStep) => void;
  onChangeOrder: (selectedId: string, targetId: string) => void;
  readOnly: boolean;
}) {
  const dragKey = `evaluationItem-${key}`;
  const [, , draggableRef, draggableStyle] = useSortable('view', dragKey, !readOnly, onChangeOrder);
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${evaluation.id}` });

  function duplicateEvaluation() {
    onDuplicate(evaluation);
    popupState.close();
  }

  function deleteEvaluation() {
    onDelete(evaluation.id);
    popupState.close();
  }

  function renameEvaluation() {}

  return (
    <Card style={draggableStyle} variant='outlined' ref={draggableRef} sx={{ mb: 1 }}>
      <Box p={1} display='flex' alignItems='center' gap={1} justifyContent='space-between'>
        <DragIcon size='small'>
          <DragIndicator color='secondary' fontSize='small' />
        </DragIcon>
        <Typography sx={{ flexGrow: 1 }}>{evaluation.title}</Typography>
        <Menu {...bindMenu(popupState)}>
          <MenuItem onClick={renameEvaluation}>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem onClick={duplicateEvaluation}>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem onClick={deleteEvaluation}>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
        <Box display='flex' gap={2} alignItems='center'>
          <IconButton size='small' {...bindTrigger(popupState)}>
            <MoreHoriz fontSize='small' />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
}
