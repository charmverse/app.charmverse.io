import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';

import { useOnboarding } from './hooks/useOnboarding';
import { MemberDialog } from './MemberDialog';

// TODO: we should be able to just use the global member dialog?

export function MemberDialogOnboarding() {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { onboarded, completeOnboarding } = useOnboarding();
  const { accessChecked } = useSharedPage();

  if (
    !accessChecked ||
    !space ||
    onboarded !== false ||
    !user ||
    !user.spaceRoles.some((sr) => sr.spaceId === space.id)
  ) {
    return null;
  }

  return (
    <div data-test='member-onboarding-form'>
      <MemberDialog
        isOnboarding={!user.email}
        memberId={user.id}
        onClose={completeOnboarding}
        title={`Welcome to ${space.name}. Set up your profile`}
      />
    </div>
  );
}
