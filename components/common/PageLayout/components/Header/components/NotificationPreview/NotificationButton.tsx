import { useTheme } from '@emotion/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { IconButton, useMediaQuery } from '@mui/material';
import Popover from '@mui/material/Popover';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';

import NotificationsBadge from '../../../Sidebar/NotificationsBadge';

import { NotificationPreviewPopover } from './NotificationPreviewPopover';

export default function NotificationButton({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const handleSeeAllClick = () => {
    onSeeAllClick();
    popupState.close();
  };
  return (
    <>
      <NotificationsBadge>
        <IconButton onClick={popupState.open} size={isLargeScreen ? 'small' : 'medium'}>
          <NotificationsIcon fontSize='small' color='secondary' />
        </IconButton>
      </NotificationsBadge>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            width: 375
          }
        }}
      >
        <NotificationPreviewPopover onSeeAllClick={handleSeeAllClick} close={popupState.close} />
      </Popover>
    </>
  );
}
