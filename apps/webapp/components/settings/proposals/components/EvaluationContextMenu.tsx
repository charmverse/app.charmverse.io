import { MoreHoriz, ContentCopyOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import type { WorkflowEvaluationJson } from '@packages/core/proposals';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';

export type ContextMenuProps = {
  evaluation: WorkflowEvaluationJson;
  onDelete: (id: string) => void;
  onDuplicate: (evaluation: WorkflowEvaluationJson) => void;
  onEdit: (evaluation: WorkflowEvaluationJson) => void;
  readOnly: boolean;
};

export function EvaluationContextMenu({ evaluation, onDelete, onDuplicate, onEdit, readOnly }: ContextMenuProps) {
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${evaluation.id}` });

  function duplicateEvaluation() {
    onDuplicate({ ...evaluation, title: `${evaluation.title} (copy)` });
  }

  function deleteEvaluation() {
    onDelete(evaluation.id);
  }

  function editEvaluation() {
    onEdit(evaluation);
  }
  return (
    <>
      <Menu {...bindMenu(popupState)} onClick={popupState.close}>
        <MenuItem disabled={readOnly} onClick={editEvaluation}>
          <ListItemIcon>
            <EditOutlined fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem disabled={readOnly} onClick={duplicateEvaluation}>
          <ListItemIcon>
            <ContentCopyOutlined fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem disabled={readOnly} onClick={deleteEvaluation}>
          <ListItemIcon>
            <DeleteOutlined fontSize='small' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <Box display='flex' gap={2} alignItems='center'>
        <IconButton size='small' {...bindTrigger(popupState)}>
          <MoreHoriz fontSize='small' />
        </IconButton>
      </Box>
    </>
  );
}
