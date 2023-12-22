import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { DeleteIcon } from 'components/common/Icons/DeleteIcon';
import { EditIcon } from 'components/common/Icons/EditIcon';

type Props = {
  deleteTemplate: (pageId: string) => void;
  editTemplate: (showPage: string) => void;
  pageId: string;
  closeParentPopup: () => void;
};

export function TemplatePageMenuActions({ deleteTemplate, closeParentPopup, pageId, editTemplate }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: `template-context-${pageId}` });

  return (
    <>
      <IconButton size='small' {...bindTrigger(popupState)} data-test={`template-menu-${pageId}`}>
        <MoreHorizIcon />
      </IconButton>

      <Menu {...bindMenu(popupState)} open={popupState.isOpen}>
        <MenuItem
          data-test={`template-menu-edit-${pageId}`}
          onClick={(e) => {
            e.stopPropagation();
            popupState.close();
            closeParentPopup();
            editTemplate(pageId);
          }}
        >
          <EditIcon fontSize='small' />
          <Typography variant='body2' color='text.secondary'>
            Edit
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            popupState.close();
            deleteTemplate(pageId);
          }}
        >
          <DeleteIcon fontSize='small' />
          <Typography variant='body2' color='text.secondary'>
            Delete
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
