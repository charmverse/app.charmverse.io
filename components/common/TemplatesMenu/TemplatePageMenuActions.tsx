import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { DeleteIcon } from 'components/common/Icons/DeleteIcon';
import { EditIcon } from 'components/common/Icons/EditIcon';
import Link from 'components/common/Link';

type Props = {
  deleteTemplate: (pageId: string) => void;
  pageId: string;
};

export function TemplatePageMenuActions({ deleteTemplate, pageId }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: `template-context-${pageId}` });

  return (
    <>
      <IconButton size='small' {...bindTrigger(popupState)}>
        <MoreHorizIcon />
      </IconButton>

      <Menu {...bindMenu(popupState)} open={popupState.isOpen}>
        <MenuItem component={Link} href={`/${pageId}`} target='_blank'>
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
