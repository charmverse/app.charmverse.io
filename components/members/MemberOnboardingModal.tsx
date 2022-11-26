import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';

import { MemberOnboardingForm } from './components/MemberOnboardingForm';

export function MemberOnboardingModal () {
  const space = useCurrentSpace();
  const { user, setUser } = useUser();
  const { hideOnboarding } = useOnboarding();
  const { onboarding } = useOnboarding();

  function onClose () {
    if (space) {
      hideOnboarding(space.id);
    }
  }

  if (!space || !onboarding[space.id] || !user) {
    return null;
  }

  log.debug('show onboarding form');

  return (
    <MemberOnboardingForm
      user={user}
      setUser={setUser}
      spaceName={space.name}
      spaceId={space.id}
      onClose={onClose}
    />
  );
}
