import type { CredentialEventType } from '@charmverse/core/prisma-client';

import { useIsAdmin } from 'hooks/useIsAdmin';

import type { CredentialToggled } from './CredentialEventToggle';
import { CredentialEventToggle } from './CredentialEventToggle';

const availableCredentialEvents: CredentialEventType[] = ['proposal_approved', 'proposal_created'];

type Props = {
  selectedCredentialEvents: CredentialEventType[];
  onChange: (credentialEvents: CredentialEventType[]) => void;
};

export function CredentialEventsSelector({ selectedCredentialEvents, onChange }: Props) {
  const isAdmin = useIsAdmin();

  function handleChangeEvent({ credentialEvent, selected }: CredentialToggled) {
    if (selected && !selectedCredentialEvents.includes(credentialEvent)) {
      onChange([...selectedCredentialEvents, credentialEvent]);
    } else if (!selected) {
      onChange(selectedCredentialEvents.filter((e) => e !== credentialEvent));
    }
  }

  return (
    <div>
      {availableCredentialEvents.map((credentialEvent) => (
        <CredentialEventToggle
          checked={selectedCredentialEvents.includes(credentialEvent)}
          credentialEvent={credentialEvent}
          onChange={handleChangeEvent}
          disabled={!isAdmin}
          key={credentialEvent}
        />
      ))}
    </div>
  );
}
