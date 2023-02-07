import styled from '@emotion/styled';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { headerHeight } from '../Header';

import { SidebarProfile } from './SidebarProfile';
import WorkspaceAvatar from './WorkspaceAvatar';

const StyledButton = styled(Button)(
  ({ theme }) => `
  justify-content: flex-start;
  padding: ${theme.spacing(0.3, 5, 0.3, 2)};
  '&:hover': { 
    backgroundColor: ${theme.palette.action.hover};
  }
  ${theme.breakpoints.up('lg')} {
    padding-right: ${theme.spacing(2)};
  }
`
);

const SidebarHeader = styled(Box)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${headerHeight}px;
  .MuiIconButton-root, .MuiButton-root {
    transition: ${theme.transitions.create('all', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })}
  }
  & .MuiIconButton-root {
    border-radius: 4px;
  }`
);

export default function SidebarSubmenu({ closeSidebar }: { closeSidebar: () => void }) {
  const currentSpace = useCurrentSpace();

  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'profile-dropdown' });

  return (
    <SidebarHeader className='sidebar-header' position='relative'>
      <StyledButton
        data-test='sidebar-space-menu'
        endIcon={<KeyboardArrowDownIcon fontSize='small' />}
        variant='text'
        color='inherit'
        fullWidth
        {...bindTrigger(menuPopupState)}
      >
        <WorkspaceAvatar name={currentSpace?.name ?? ''} image={currentSpace?.spaceImage ?? null} />
        <Typography variant='body1' data-test='sidebar-space-name' noWrap ml={1}>
          {currentSpace?.name}
        </Typography>
      </StyledButton>
      <SidebarProfile menuPopupState={menuPopupState} />
      <Tooltip title='Close sidebar' placement='bottom'>
        <IconButton onClick={closeSidebar} size='small' sx={{ position: 'absolute', right: 0, top: 12 }}>
          <MenuOpenIcon />
        </IconButton>
      </Tooltip>
    </SidebarHeader>
  );
}
