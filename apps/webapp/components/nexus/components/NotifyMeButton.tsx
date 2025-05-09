import EmailIcon from '@mui/icons-material/Mail';
import Tooltip from '@mui/material/Tooltip';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useUser } from 'hooks/useUser';

import NotifyMeModal from './NotifyMeModal';

export default function NotifyMeButton() {
  const { user, updateUser } = useUser();

  const popupState = usePopupState({
    popupId: 'snooze-transactions-message',
    variant: 'popover'
  });

  async function saveEmail(email: string | null) {
    await charmClient.updateUser({ email });
    updateUser({ email });
  }

  return (
    <>
      <Tooltip arrow placement='top' title={user?.email ? `Sending to: ${user?.email}` : ''}>
        <Button
          color='secondary'
          size='small'
          variant='outlined'
          startIcon={<EmailIcon fontSize='small' />}
          // required to vertically align this button with its siblings
          sx={{ display: 'flex', fontSize: { xs: '12px', sm: '14px' } }}
          {...bindTrigger(popupState)}
        >
          {user?.email ? 'Notification Settings' : 'Notify Me'}
        </Button>
      </Tooltip>
      <NotifyMeModal
        isOpen={popupState.isOpen}
        close={popupState.close}
        save={async (email: string) => {
          await saveEmail(email);
          popupState.close();
        }}
        currentValue={user?.email}
      />
    </>
  );
}
