import { useState, MouseEvent } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import styled from '@emotion/styled';
import { Page } from 'models';
import { greyColor2 } from 'theme/colors';

const StyledIconButton = styled(IconButton)`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  height: 16px;
  width: 16px;
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

export const StyledDatabaseIcon = styled(DatabaseIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

type Props = { addPage: (p: Partial<Page>) => void, tooltip: string, sx?: any };

export default function NewPageMenu ({ addPage, tooltip, ...props }: Props) {

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
      <Tooltip disableInteractive title={tooltip} leaveDelay={0} placement='right' arrow>
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
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Board</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
