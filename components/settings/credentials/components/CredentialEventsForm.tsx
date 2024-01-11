import type { IssueCredentialEvent } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';

import type { CredentialToggled } from './CredentialEventToggle';
import { CredentialEventToggle } from './CredentialEventToggle';

const availableCredentialEvents: IssueCredentialEvent[] = ['proposal_approved', 'proposal_created'];

export function CredentialEventsForm() {
  const { space } = useCurrentSpace();
  const { setSpace } = useSpaces();
  const [isUpdatingCredentialEvents, setIsUpdatingCredentialEvents] = useState(false);

  const isAdmin = useIsAdmin();
  const [touched, setTouched] = useState<boolean>(false);

  const { showMessage } = useSnackbar();

  const [credentialEvents, setCredentialEvents] = useState(space?.credentialEvents ?? []);

  function handleChangeEvent({ credentialEvent, selected }: CredentialToggled) {
    if (selected && !credentialEvents.includes(credentialEvent)) {
      setCredentialEvents([...credentialEvents, credentialEvent]);
    } else if (!selected) {
      setCredentialEvents(credentialEvents.filter((e) => e !== credentialEvent));
    }
  }

  const settingsChanged =
    credentialEvents.some((e) => !space?.credentialEvents.includes(e)) ||
    space?.credentialEvents.some((e) => !credentialEvents.includes(e));

  async function updateSpaceCredentialEvents() {
    if (space && settingsChanged) {
      setIsUpdatingCredentialEvents(true);

      try {
        const updatedSpace = await charmClient.credentials.updateSpaceCredentialEvents({
          credentialEvents,
          spaceId: space.id
        });

        setSpace(updatedSpace);
      } catch (err) {
        showMessage((err as Error).message ?? 'Could not update events triggering credentials', 'error');
      } finally {
        setIsUpdatingCredentialEvents(false);
      }
    }
  }

  if (!space) {
    return null;
  }

  return (
    <div>
      {availableCredentialEvents.map((credentialEvent) => (
        <CredentialEventToggle
          checked={credentialEvents.includes(credentialEvent)}
          credentialEvent={credentialEvent}
          onChange={handleChangeEvent}
          disabled={!isAdmin}
          key={credentialEvent}
        />
      ))}
      <Box display='flex' justifyContent='flex-end'>
        <Button
          onClick={updateSpaceCredentialEvents}
          loading={isUpdatingCredentialEvents}
          disabled={!isAdmin || !settingsChanged}
          type='submit'
          variant='contained'
          color='primary'
          size='small'
          sx={{ mt: 2 }}
        >
          Save
        </Button>
      </Box>
    </div>
  );
}
