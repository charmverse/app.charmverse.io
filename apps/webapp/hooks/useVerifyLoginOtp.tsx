import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

type Context = {
  open: () => void;
  isOpen: boolean;
  close: () => void;
};

const VerifyLoginOtpContext = createContext<Context | null>(null);

export function VerifyLoginOtpProvider({ children }: { children: ReactNode }) {
  const otpPopup = usePopupState({ variant: 'popover', popupId: 'otp-popup' });

  const value = useMemo(
    () => ({
      isOpen: otpPopup.isOpen,
      open: otpPopup.open,
      close: otpPopup.close
    }),
    [otpPopup.isOpen]
  );
  return <VerifyLoginOtpContext.Provider value={value}>{children}</VerifyLoginOtpContext.Provider>;
}

export const useVerifyLoginOtp = () => {
  const context = useContext(VerifyLoginOtpContext);

  if (!context) {
    throw new Error('useVerifyLoginOtp must be used within a VerifyLoginOtpProvider');
  }

  return context;
};
