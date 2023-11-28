import { log } from '@charmverse/core/log';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { MemberPropertiesForm } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesForm';
import { DialogContainer } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesFormDialog';
import { ProfileWidgets } from 'components/members/components/MemberProfile/components/ProfileWidgets/ProfileWidgets';
import { useMemberPropertyValues } from 'components/members/hooks/useMemberPropertyValues';
import Legend from 'components/settings/Legend';
import type { EditableFields } from 'components/settings/profile/components/UserDetailsForm';
import { UserDetailsForm } from 'components/settings/profile/components/UserDetailsForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';

import { useOnboarding } from '../hooks/useOnboarding';

import { OnboardingEmailForm } from './OnboardingEmailForm';

type Step = 'email_step' | 'profile_step';

export function UserOnboardingDialogGlobal() {
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const { showOnboardingFlow, completeOnboarding } = useOnboarding({ user, spaceId: space?.id });

  // Wait for user to load before deciding what to show
  if (!user) {
    return null;
  }
  // Show member profile for onboarding
  if (showOnboardingFlow) {
    log.info('[user-journey] Show onboarding flow');
    return (
      <div data-test='member-onboarding-form'>
        <UserOnboardingDialog key={user.id} isOnboarding currentUser={user} onClose={completeOnboarding} />
      </div>
    );
  }

  return null;
}

function UserOnboardingDialog({
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
  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });

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

  const handleClose = () => {
    if (!isFormClean) {
      confirmExitPopupState.open();
    } else {
      onClose();
    }
  };

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
    <DialogContainer
      fluidSize={currentStep === 'email_step'}
      title={title}
      onClose={currentStep !== 'email_step' ? handleClose : undefined}
      hideCloseButton={currentStep === 'email_step'}
    >
      {currentStep === 'email_step' ? (
        <OnboardingEmailForm onClick={goNextStep} spaceId={currentSpace.id} />
      ) : currentStep === 'profile_step' ? (
        <>
          <UserDetailsForm
            sx={{
              mt: 0
            }}
            user={currentUser}
            onChange={onUserDetailsChange}
            memberProperties={memberProperties ?? []}
          />
          <Legend mt={4}>Member details</Legend>
          <MemberPropertiesForm
            properties={memberProperties}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberDetailsChange}
            userId={currentUser.id}
            showCollectionOptions
          />
          <Legend mt={4}>Profiles</Legend>
          <ProfileWidgets userId={currentUser.id} />
          <Box display='flex' justifyContent='flex-end' mt={2}>
            <Button disableElevation size='large' onClick={saveForm} disabled={isFormClean}>
              Save
            </Button>
          </Box>
          <ConfirmDeleteModal
            onClose={confirmExitPopupState.close}
            title='Unsaved changes'
            open={confirmExitPopupState.isOpen}
            buttonText='Discard'
            secondaryButtonText='Cancel'
            question='Are you sure you want to close this window? You have unsaved changes.'
            onConfirm={() => {
              confirmExitPopupState.close();
              onClose();
            }}
          />
        </>
      ) : null}
    </DialogContainer>
  );
}
