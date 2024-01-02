import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, ListItemText } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { DeleteIcon } from 'components/common/Icons/DeleteIcon';
import { EditIcon } from 'components/common/Icons/EditIcon';

export type Props = {
  deleteTemplate: (pageId: string) => void;
  editTemplate: (showPage: string) => void;
  pageId: string;
  closeParentPopup: () => void;
  pageActions?: (props: { pageId: string }) => ReactNode;
};

export function TemplatePageActionMenu(props: Props) {
  const { pageId, closeParentPopup, pageActions } = props;
  const popupState = usePopupState({ variant: 'popover', popupId: `template-context-${pageId}` });
  const pageActionsMemo = useMemo(() => pageActions?.({ pageId }), [pageId]);

  return (
    <>
      <IconButton size='small' {...bindTrigger(popupState)} data-test={`template-menu-${pageId}`}>
        <MoreHorizIcon />
      </IconButton>

      <Menu
        {...bindMenu(popupState)}
        open={popupState.isOpen}
        onClick={(e) => {
          e.stopPropagation();
          popupState.close();
          closeParentPopup();
        }}
      >
        {pageActionsMemo || <TemplatePageMenuActionsDefaultContent {...props} />}
      </Menu>
    </>
  );
}

function TemplatePageMenuActionsDefaultContent({
  deleteTemplate,
  pageId,
  editTemplate
}: Pick<Props, 'deleteTemplate' | 'pageId' | 'editTemplate'>) {
  return (
    <>
      <MenuItem
        data-test={`template-menu-edit-${pageId}`}
        onClick={(e) => {
          editTemplate(pageId);
        }}
      >
        <ListItemIcon>
          <EditIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Edit</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={(e) => {
          deleteTemplate(pageId);
        }}
      >
        <ListItemIcon>
          <DeleteIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </>
  );
}
