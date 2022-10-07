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
import { useState, memo } from 'react';

import type { Page } from 'models';
import { greyColor2 } from 'theme/colors';

import { StyledDatabaseIcon } from './PageIcon';

export const StyledIconButton = styled(IconButton)`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  width: 20px;
  height: 20px;
  svg {
    font-size: 16px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

export const StyledArticleIcon = styled(ArticleIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

type Props = { addPage: (p: Partial<Page>) => void, tooltip: string, sx?: any };

function NewPageMenu ({ addPage, tooltip, ...props }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const createPage = (page: { type: Page['type'] }) => {
    handleClose();
    addPage(page);
  };

  return (
    <>
      <Tooltip disableInteractive title={tooltip} leaveDelay={0} placement='top' arrow>
        <StyledIconButton onClick={handleClick} {...props}>
          <AddIcon color='secondary' />
        </StyledIconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => createPage({ type: 'page' })}>
          <ListItemIcon><StyledArticleIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Page</Typography>
        </MenuItem>
        <MenuItem onClick={() => createPage({ type: 'board' })}>
          <ListItemIcon><StyledDatabaseIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Database</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export default memo(NewPageMenu);
