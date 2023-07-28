import { Box } from '@mui/material';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/Legend';
import type { EditableFields } from 'components/u/components/UserDetails/UserDetailsForm';
import { UserDetailsForm } from 'components/u/components/UserDetails/UserDetailsForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
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
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { memberPropertyValues, updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(currentUser.id);

  const [userDetails, setUserDetails] = useState<EditableFields>({});
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);
  const { mutateMembers } = useMembers();

  function onUserDetailsChange(fields: EditableFields) {
    setUserDetails((_form) => ({ ..._form, ...fields }));
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  const isFormClean = Object.keys(userDetails).length === 0 && memberDetails.length === 0;

  usePreventReload(!isFormClean);

  async function saveForm() {
    if (isFormClean) {
      onClose();
      return;
    }
    if (Object.keys(userDetails).length > 0) {
      await charmClient.updateUserDetails(userDetails);
    }
    if (currentSpace) {
      await updateSpaceValues(currentSpace.id, memberDetails);
    }
    mutateMembers();
    onClose();
    setUserDetails({});
    setMemberDetails([]);
    showMessage('Profile updated', 'success');
    mutate('/current-user-details');
  }

  const [currentStep, setCurrentStep] = useState<Step>(
    isOnboarding && !currentUser.email ? 'email_step' : 'profile_step'
  );

  function goNextStep() {
    setCurrentStep('profile_step');
  }

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, currentSpace?.id]
  );

  // dont show a modal until the space is loaded at least
  if (!currentSpace) {
    return null;
  }

  let title = 'Edit your profile';

  if (isOnboarding) {
    if (currentStep === 'email_step') {
      title = 'Welcome to CharmVerse';
    } else if (currentStep === 'profile_step') {
      // wrap hyphens with word joiner so that it doesn't wrap: https://en.wikipedia.org/wiki/Word_joiner
      title = `Welcome to ${currentSpace.name.replace(/-/g, '\ufeff-\ufeff')}! Set up your profile`;
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
            onChange={onUserDetailsChange}
          />
          <Legend mt={4}>Member details</Legend>
          <MemberPropertiesForm
            properties={memberProperties}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberDetailsChange}
            userId={currentUser.id}
            showCollectionOptions
          />
          <Box display='flex' justifyContent='flex-end' mt={2}>
            <Button disableElevation size='large' onClick={saveForm}>
              Save
            </Button>
          </Box>
        </>
      ) : null}
    </UserProfileDialog>
  );
}
