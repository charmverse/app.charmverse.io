import type { Page } from '@charmverse/core/prisma';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import { ListItemIcon, ListItemText } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { AddIconButton } from '../../AddIconButton';

type Props = { addPage: (p: Partial<Page>) => void; tooltip: string };

function NewPageMenu({ addPage, tooltip }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  };
  const handleClose = (event?: any) => {
    setAnchorEl(null);
    event?.stopPropagation();
  };
  const createPage = (event: any | undefined, page: { type: Page['type'] }) => {
    addPage(page);
    handleClose();
    event?.stopPropagation();
  };

  return (
    <>
      <AddIconButton data-test='add-page' onClick={handleClick} tooltip={tooltip} />

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={(e) => createPage(e, { type: 'page' })}>
          <ListItemIcon>
            <ArticleIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Add Page</ListItemText>
        </MenuItem>
        {/* create a linked board page by default, which can be changed to 'board' by the user */}
        <MenuItem data-test='menu-add-database' onClick={(e) => createPage(e, { type: 'linked_board' })}>
          <ListItemIcon>
            <DatabaseIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Add Database</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default memo(NewPageMenu);
