import NotificationsIcon from '@mui/icons-material/Notifications';
import { IconButton } from '@mui/material';
import Popover from '@mui/material/Popover';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';

import { useMdScreen } from 'hooks/useMediaScreens';

import { NotificationModal } from './NotificationModal';
import { NotificationPreviewPopover } from './NotificationPreviewPopover';
import NotificationsBadge from './NotificationsBadge';

export function NotificationButton() {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const isMdScreen = useMdScreen();

  return (
    <>
      <NotificationsBadge onClick={popupState.open} sx={{ cursor: 'pointer' }}>
        <IconButton size={isMdScreen ? 'small' : 'medium'}>
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
        <NotificationPreviewPopover close={popupState.close} />
      </Popover>

      <NotificationModal />
    </>
  );
}
