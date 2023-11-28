import { log } from '@charmverse/core/log';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { MemberPropertiesForm } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesForm';
import { DialogContainer } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesFormDialog';
import { ProfileWidgets } from 'components/members/components/MemberProfile/components/ProfileWidgets/ProfileWidgets';
import { useMemberPropertyValues } from 'components/members/hooks/useMemberPropertyValues';
import {
  useRequiredMemberProperties,
  useRequiredMemberPropertiesForm
} from 'components/members/hooks/useRequiredMemberProperties';
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

  // Wait for user to load before deciding what to show
  if (!user || !space) {
    return null;
  }

  return <LoggedInUserOnboardingDialog user={user} spaceId={space.id} />;
}

function LoggedInUserOnboardingDialog({ user, spaceId }: { spaceId: string; user: LoggedInUser }) {
  const { showOnboardingFlow, completeOnboarding } = useOnboarding({ user, spaceId });

  useEffect(() => {
    log.info('[user-journey] Show onboarding flow');
  }, []);

  const { requiredPropertiesWithoutValue } = useRequiredMemberProperties({
    userId: user.id
  });

  if (showOnboardingFlow) {
    return (
      <div data-test='member-onboarding-form'>
        <UserOnboardingDialog key={user.id} isOnboarding currentUser={user} onClose={completeOnboarding} />
      </div>
    );
  }

  if (requiredPropertiesWithoutValue.length) {
    return (
      <div data-test='member-onboarding-form'>
        <UserOnboardingDialog key={user.id} currentUser={user} onClose={completeOnboarding} />
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
  const { control, errors, isValid, memberProperties, values, requiredProperties } = useRequiredMemberPropertiesForm({
    userId: currentUser.id
  });
  const { space: currentSpace } = useCurrentSpace();
  const { updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(currentUser.id);
  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });
  const { data: userDetailsData } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const [userDetails, setUserDetails] = useState<EditableFields>({});
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);
  const { mutateMembers } = useMembers();
  const isTimezoneRequired = requiredProperties.find((p) => p.type === 'timezone');
  const isBioRequired = requiredProperties.find((p) => p.type === 'bio');
  const isInputValid =
    requiredProperties.length === 0 ||
    (isValid && (!isTimezoneRequired || !!userDetails.timezone) && (!isBioRequired || !!userDetails.description));

  function onUserDetailsChange(fields: EditableFields) {
    setUserDetails((_form) => ({ ..._form, ...fields }));
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  const isFormClean = Object.keys(userDetails).length === 0 && memberDetails.length === 0;

  usePreventReload(!isFormClean);

  useEffect(() => {
    setUserDetails({
      description: userDetailsData?.description ?? '',
      timezone: userDetailsData?.timezone ?? ''
    });
  }, [userDetailsData]);

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
      hideCloseButton={currentStep === 'email_step' || requiredProperties.length !== 0}
      footerActions={
        currentStep === 'profile_step' ? (
          <Box mr={4.5}>
            <Button
              disableElevation
              size='large'
              onClick={saveForm}
              disabled={isFormClean || !isInputValid}
              disabledTooltip={isFormClean ? 'No changes to save' : 'Please fill out all required fields'}
            >
              Save
            </Button>
          </Box>
        ) : null
      }
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
            values={values}
            control={control}
            errors={errors}
            properties={memberProperties}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberDetailsChange}
            userId={currentUser.id}
            showCollectionOptions
          />
          <Legend mt={4}>Profiles</Legend>
          <ProfileWidgets userId={currentUser.id} />
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
