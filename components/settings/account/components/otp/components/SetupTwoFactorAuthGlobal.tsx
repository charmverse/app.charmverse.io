import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';

import { TwoFactorAuthSetupModal } from './TwoFactorAuthSetupModal';

export function SetupTwoFactorAuthGlobal() {
  const otpSetupModal = usePopupState({ variant: 'popover', popupId: 'otp-setup' });
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const activeOtp = !!user?.userOTP?.activatedAt;
  const spaceRequiresOtp = !!space?.requireMembersTwoFactorAuth;
  const isCharmverseSpace = useIsCharmverseSpace();

  useEffect(() => {
    if (!activeOtp && spaceRequiresOtp && otpSetupModal.isOpen === false && isCharmverseSpace) {
      otpSetupModal.open();
    }
  }, [activeOtp, spaceRequiresOtp, isCharmverseSpace]);

  if (
    !isCharmverseSpace ||
    !user ||
    !space?.requireMembersTwoFactorAuth ||
    (user.userOTP?.activatedAt && !otpSetupModal.isOpen)
  ) {
    return null;
  }

  const onClose = activeOtp && spaceRequiresOtp ? otpSetupModal.close : undefined;

  return <TwoFactorAuthSetupModal {...bindPopover(otpSetupModal)} onClose={onClose} />;
}
