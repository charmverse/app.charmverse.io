import { useState } from 'react';

import Legend from 'components/settings/Legend';
import { UserDetailsForm } from 'components/u/components/UserDetails/UserDetailsForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import type { LoggedInUser } from 'models';

import { useMemberPropertyValues } from '../hooks/useMemberPropertyValues';
import { UserProfileDialog } from '../UserProfileDialog';

import { MemberPropertiesForm } from './MemberPropertiesForm';
import { OnboardingEmailForm } from './OnboardingEmailForm';

type Step = 'email_step' | 'profile_step';

export function CurrentUserProfile({
  currentUser,
  onClose,
  isOnboarding = false
}: {
  onClose: VoidFunction;
  currentUser: LoggedInUser;
  isOnboarding?: boolean;
}) {
  const { setUser } = useUser();
  const currentSpace = useCurrentSpace();
  const { updateSpaceValues } = useMemberPropertyValues(currentUser.id);

  const [currentStep, setCurrentStep] = useState<Step>(isOnboarding ? 'email_step' : 'profile_step');

  function goNextStep() {
    setCurrentStep('profile_step');
  }

  if (!currentSpace) {
    return null;
  }

  let title = 'Edit your profile';

  if (isOnboarding) {
    if (currentStep === 'email_step') {
      title = 'Welcome to CharmVerse';
    } else if (currentStep === 'profile_step') {
      title = `Welcome to ${currentSpace.domain}. Set up your profile`;
    }
  }

  return (
    <UserProfileDialog fluidSize={currentStep === 'email_step'} onClose={onClose} title={title}>
      {currentStep === 'email_step' ? (
        <OnboardingEmailForm onClick={goNextStep} />
      ) : currentStep === 'profile_step' ? (
        <>
          <UserDetailsForm
            sx={{
              mt: 0
            }}
            user={currentUser}
            updateUser={setUser}
          />
          <Legend mt={4}>Member details</Legend>
          <MemberPropertiesForm
            userId={currentUser.id}
            spaceId={currentSpace.id}
            updateMemberPropertyValues={updateSpaceValues}
            showBlockchainData
          />
        </>
      ) : null}
    </UserProfileDialog>
  );
}
