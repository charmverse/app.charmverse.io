import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DatabaseIcon from '@mui/icons-material/TableChart';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
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
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });

  const createPage = (page: { type: Page['type'] }) => {
    addPage(page);
    popupState.close();
  };

  return (
    <>
      <Tooltip disableInteractive title={tooltip} leaveDelay={0} placement='right' arrow>
        <StyledIconButton {...props} {...bindTrigger(popupState)}>
          <AddIcon color='secondary' />
        </StyledIconButton>
      </Tooltip>

      <Menu
        {...bindMenu(popupState)}
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
