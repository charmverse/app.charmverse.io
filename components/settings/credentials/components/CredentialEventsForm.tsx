import type { AttestationType, CredentialEventType } from '@charmverse/core/prisma-client';

import { useIsAdmin } from 'hooks/useIsAdmin';

import type { CredentialToggled } from './CredentialEventToggle';
import { CredentialEventToggle } from './CredentialEventToggle';

const availableCredentialEvents: Record<AttestationType, CredentialEventType[]> = {
  proposal: ['proposal_approved'],
  reward: ['reward_submission_approved'],
  external: ['proposal_approved']
};

type Props = {
  selectedCredentialEvents: CredentialEventType[];
  onChange: (credentialEvents: CredentialEventType[]) => void;
  credentialTemplateType: AttestationType;
};

export function CredentialEventsSelector({ selectedCredentialEvents, onChange, credentialTemplateType }: Props) {
  const isAdmin = useIsAdmin();

  function handleChangeEvent({ credentialEvent, selected }: CredentialToggled) {
    if (selected && !selectedCredentialEvents.includes(credentialEvent)) {
      onChange([...selectedCredentialEvents, credentialEvent]);
    } else if (!selected) {
      onChange(selectedCredentialEvents.filter((e) => e !== credentialEvent));
    }
  }

  if (!credentialTemplateType) {
    return null;
  }

  return (
    <div>
      {availableCredentialEvents[credentialTemplateType].map((credentialEvent) => (
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
