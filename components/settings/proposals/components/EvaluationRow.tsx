import { ProposalEvaluationType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { DragIndicator, MoreHoriz } from '@mui/icons-material';
import { Box, Card, IconButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';

import { useSortable } from 'components/common/BoardEditor/focalboard/src/hooks/sortable';
import type { EvaluationTemplate } from 'lib/proposal/evaluationWorkflows';

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
  onDelete: (id: string) => void;
  onDuplicate: (evaluation: EvaluationTemplate) => void;
  onRename: (evaluation: EvaluationTemplate) => void;
  onChangeOrder: (selectedId: string, targetId: string) => void;
  readOnly: boolean;
}) {
  const dragKey = `evaluationItem-${key}`;
  const [, , draggableRef, draggableStyle] = useSortable('view', dragKey, !readOnly, onChangeOrder);
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${evaluation.id}` });

  function duplicateEvaluation() {
    onDuplicate(evaluation);
  }

  function deleteEvaluation() {
    onDelete(evaluation.id);
  }

  function renameEvaluation() {
    onRename(evaluation);
  }

  return (
    <Card style={draggableStyle} variant='outlined' ref={draggableRef} sx={{ mb: 1 }}>
      <Box p={1} display='flex' alignItems='center' gap={1} justifyContent='space-between'>
        <DragIcon size='small'>
          <DragIndicator color='secondary' fontSize='small' />
        </DragIcon>
        <Typography sx={{ flexGrow: 1 }}>
          {evaluation.title} <em>({friendlyTypes[evaluation.type]})</em>
        </Typography>
        <Menu {...bindMenu(popupState)} onClick={popupState.close}>
          <MenuItem disabled={readOnly} onClick={renameEvaluation}>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem disabled={readOnly} onClick={duplicateEvaluation}>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem disabled={readOnly} onClick={deleteEvaluation}>
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
