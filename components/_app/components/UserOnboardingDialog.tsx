import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma-client';
import { Alert } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { ConnectedAccounts } from 'components/members/components/ConnectedAccounts';
import { MemberPropertiesForm } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesForm';
import { DialogContainer } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberPropertiesFormDialog';
import { ProfileWidgets } from 'components/members/components/MemberProfile/components/ProfileWidgets/ProfileWidgets';
import { useMemberPropertyValues } from 'components/members/hooks/useMemberPropertyValues';
import {
  useRequiredMemberProperties,
  useRequiredMemberPropertiesForm,
  useRequiredUserDetailsForm
} from 'components/members/hooks/useRequiredMemberProperties';
import Legend from 'components/settings/Legend';
import { UserDetailsForm } from 'components/settings/profile/components/UserDetailsForm';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { LoggedInUser } from 'models';

import type { OnboardingStep } from '../hooks/useOnboarding';
import { useOnboarding } from '../hooks/useOnboarding';

import { OnboardingEmailForm } from './OnboardingEmailForm';

export function UserOnboardingDialogGlobal() {
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const { getMemberById } = useMembers();
  const member = user ? getMemberById(user.id) : null;

  // Wait for user to load before deciding what to show
  if (!user || !space || !member || member.isGuest) {
    return null;
  }

  return <LoggedInUserOnboardingDialog user={user} space={space} />;
}

function LoggedInUserOnboardingDialog({ user, space }: { space: Space; user: LoggedInUser }) {
  const { onboardingStep, completeOnboarding } = useOnboarding({ user, spaceId: space.id });
  const { query } = useRouter();
  useEffect(() => {
    log.info('[user-journey] Show onboarding flow');
  }, []);

  const { hasEmptyRequiredProperties } = useRequiredMemberProperties({
    userId: user.id
  });

  if (onboardingStep) {
    return (
      <UserOnboardingDialog
        space={space}
        key={user.id}
        initialStep={onboardingStep}
        currentUser={user}
        completeOnboarding={completeOnboarding}
        hasEmptyRequiredProperties={hasEmptyRequiredProperties}
      />
    );
  }

  if (hasEmptyRequiredProperties || query.onboarding === 'true') {
    return (
      <UserOnboardingDialog
        space={space}
        key={user.id}
        currentUser={user}
        hasEmptyRequiredProperties={hasEmptyRequiredProperties}
      />
    );
  }

  return null;
}

// Case 1: first time user: show email + terms first, then profile
// Case 2: first time joining a space: show profile
// Case 3: missing required information: show profile
function UserOnboardingDialog({
  currentUser,
  completeOnboarding,
  initialStep,
  space,
  hasEmptyRequiredProperties
}: {
  completeOnboarding?: () => Promise<void>;
  currentUser: LoggedInUser;
  initialStep?: OnboardingStep;
  space: Space;
  hasEmptyRequiredProperties?: boolean;
}) {
  const { updateURLQuery } = useCharmRouter();
  const { requiredProperties, requiredPropertiesWithoutValue } = useRequiredMemberProperties({
    userId: currentUser.id
  });
  const {
    control: memberPropertiesControl,
    errors: memberPropertiesErrors,
    isValid: isMemberPropertiesValid,
    values: memberPropertiesValues,
    onFormChange: onMemberPropertiesChange,
    isDirty: isMemberPropertiesDirty,
    isSubmitting: isMemberPropertiesSubmitting,
    onSubmit: onSubmitMemberProperties
  } = useRequiredMemberPropertiesForm({
    userId: currentUser.id
  });

  const {
    errors: userDetailsErrors,
    isValid: isUserDetailsValid,
    values: userDetailsValues,
    onFormChange: onUserDetailsChange,
    isDirty: isUserDetailsDirty,
    isSubmitting: isUserDetailsSubmitting,
    onSubmit: onSubmitUserDetails
  } = useRequiredUserDetailsForm({
    userId: currentUser.id
  });

  const { refreshPropertyValues } = useMemberPropertyValues(currentUser.id);
  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });

  const isFormDirty = isMemberPropertiesDirty || isUserDetailsDirty;

  usePreventReload(isFormDirty);

  async function saveForm() {
    if (!isFormDirty) {
      completeOnboarding?.();
      return;
    }

    await onSubmitMemberProperties();
    await onSubmitUserDetails();
    completeOnboarding?.();
  }

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || 'profile_step');

  function goNextStep() {
    setCurrentStep('profile_step');
  }

  const isSaveButtonDisabled =
    !isFormDirty ||
    !isUserDetailsValid ||
    !isMemberPropertiesValid ||
    requiredPropertiesWithoutValue.some((requiredProperty) =>
      ['discord', 'google', 'wallet', 'telegram'].includes(requiredProperty)
    );

  const handleClose = () => {
    updateURLQuery({ onboarding: null });
    if (isFormDirty) {
      confirmExitPopupState.open();
    } else {
      completeOnboarding?.();
    }
  };

  let title = 'Edit your profile';
  if (initialStep) {
    if (currentStep === 'email_step') {
      title = 'Welcome to CharmVerse';
    } else if (currentStep === 'profile_step') {
      // wrap hyphens with word joiner so that it doesn't wrap: https://en.wikipedia.org/wiki/Word_joiner
      title = `Welcome to ${space.name.replace(/-/g, '\ufeff-\ufeff')}! Set up your profile`;
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
          <Button
            disableElevation
            size='large'
            onClick={saveForm}
            loading={isUserDetailsSubmitting || isMemberPropertiesSubmitting}
            disabled={isSaveButtonDisabled}
            disabledTooltip={!isFormDirty ? 'No changes to save' : 'Please fill out all required fields'}
          >
            Save
          </Button>
        ) : null
      }
    >
      {currentStep === 'email_step' ? (
        <OnboardingEmailForm onClick={goNextStep} spaceId={space.id} />
      ) : currentStep === 'profile_step' ? (
        <>
          {hasEmptyRequiredProperties ? <Alert severity='info'>Please fill out all required fields</Alert> : null}
          <UserDetailsForm
            errors={userDetailsErrors}
            userDetails={userDetailsValues}
            sx={{
              mt: 0
            }}
            user={currentUser}
            onChange={onUserDetailsChange}
          />
          <Legend mt={4}>Build Your Identity</Legend>
          <ConnectedAccounts />
          <Legend mt={4}>Member details</Legend>
          <MemberPropertiesForm
            values={memberPropertiesValues}
            control={memberPropertiesControl}
            errors={memberPropertiesErrors}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberPropertiesChange}
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
              completeOnboarding?.();
            }}
          />
        </>
      ) : null}
    </DialogContainer>
  );
}
