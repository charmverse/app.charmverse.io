import Menu from '@mui/material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {DeleteIcon} from 'components/common/Icons/DeleteIcon';
import { EditIcon } from 'components/common/Icons/EditIcon';
import { Page } from '@prisma/client';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

type Props = {
  deleteTemplate: (pageId: string) => void
  editTemplate: (showPage: string) => void
  page: Page
  isDefaultTemplate?: boolean
}

export function TemplatePageMenuActions ({deleteTemplate, page, editTemplate, isDefaultTemplate}: Props) {

  const popupState = usePopupState({ variant: 'popover', popupId: `template-context-${page?.id}` });

  return (
    <>
    <MoreHorizIcon {...bindTrigger(popupState)} />
    <Menu {...bindMenu(popupState)} open={popupState.isOpen}>
      <MenuItem onClick={(e) => {
        e.stopPropagation();
        popupState.close();
        editTemplate(page.id);
      }}>
        <EditIcon fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          Edit
        </Typography>
      </MenuItem>


      <MenuItem onClick={(e) => {
        e.stopPropagation();
        popupState.close();
        deleteTemplate(page.id);
      }}>
        <DeleteIcon fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          Delete
        </Typography>
      </MenuItem>
    </Menu>
    </>
  )
}
