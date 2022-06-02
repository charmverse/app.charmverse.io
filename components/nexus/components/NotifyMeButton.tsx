
import Button from 'components/common/Button';
import EmailIcon from '@mui/icons-material/Mail';
import charmClient from 'charmClient';
import Tooltip from '@mui/material/Tooltip';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useUser } from 'hooks/useUser';
import NotifyMeModal from './NotifyMeModal';

export default function SnoozeButton () {

  const [user, setUser] = useUser();

  const popupState = usePopupState({
    popupId: 'snooze-transactions-message',
    variant: 'popover'
  });

  async function saveEmail (email: string | null) {
    await charmClient.updateUser({
      email
    });
    // @ts-ignore can't get types to work
    setUser(_user => ({ ..._user, email }));
  }

  return (
    <>
      <Button
        color='secondary'
        size='small'
        variant='outlined'
        startIcon={<EmailIcon fontSize='small' />}
        // required to vertically align this button with its siblings
        sx={{ display: 'flex' }}
        {...bindTrigger(popupState)}
      >
        {user?.email ? 'Unsubscribe' : 'Notify Me'}
      </Button>
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
