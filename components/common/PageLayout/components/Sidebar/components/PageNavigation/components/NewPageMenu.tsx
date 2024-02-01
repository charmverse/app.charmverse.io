import type { Page } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { greyColor2 } from 'theme/colors';

import { StyledDatabaseIcon } from '../../../../../../PageIcon';
import { AddIconButton } from '../../AddIconButton';

export const StyledArticleIcon = styled(ArticleIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

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
            <StyledArticleIcon fontSize='small' />
          </ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Page</Typography>
        </MenuItem>
        {/* create a linked board page by default, which can be changed to 'board' by the user */}
        <MenuItem data-test='menu-add-database' onClick={(e) => createPage(e, { type: 'linked_board' })}>
          <ListItemIcon>
            <StyledDatabaseIcon fontSize='small' />
          </ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Database</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export default memo(NewPageMenu);
