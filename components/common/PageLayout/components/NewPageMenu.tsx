import type { Page } from '@charmverse/core/dist/prisma';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { MouseEvent } from 'react';
import { memo, useState } from 'react';

import { greyColor2 } from 'theme/colors';

import { StyledDatabaseIcon } from './PageIcon';

export const StyledIconButton = styled(IconButton)`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  width: 20px;
  height: 20px;
  cursor: pointer;

  svg {
    font-size: 16px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      height: 26px;
      width: 26px;
  `}
`;

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
      <Tooltip disableInteractive title={tooltip} leaveDelay={0} placement='top' arrow>
        <StyledIconButton onClick={handleClick}>
          <AddIcon color='secondary' />
        </StyledIconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={(e) => createPage(e, { type: 'page' })}>
          <ListItemIcon>
            <StyledArticleIcon fontSize='small' />
          </ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Page</Typography>
        </MenuItem>
        {/* create a linked board page by default, which can be changed to 'board' by the user */}
        <MenuItem onClick={(e) => createPage(e, { type: 'linked_board' })}>
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
