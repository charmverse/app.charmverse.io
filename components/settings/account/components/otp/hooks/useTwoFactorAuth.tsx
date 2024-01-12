import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import type { SWRMutationConfiguration } from 'swr/mutation';

import { useCreateUserOtp } from 'charmClient/hooks/profile';
import type { OtpResponse } from 'lib/profile/otp/createUserOtp';

export type Screens = 'start' | 'link' | 'confirmation' | 'finish';

type IContext = {
  setFlow: (flow: Screens) => void;
  trigger: (
    extraArgument?: undefined,
    options?: SWRMutationConfiguration<OtpResponse, Error, undefined, string> | undefined
  ) => Promise<OtpResponse | undefined>;
  flow: Screens;
  error?: Error;
  data?: OtpResponse;
  isLoading: boolean;
  handleClose: () => void;
};

const TwoFactorAuthContext = createContext<Readonly<IContext>>({
  flow: 'start',
  error: undefined,
  isLoading: false,
  data: undefined,
  setFlow: () => {},
  trigger: async () => undefined,
  handleClose: () => {}
});

export function TwoFactorAuthProvider({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [flow, setFlow] = useState<Screens>('start');
  const { data, trigger, error, isMutating: isLoading } = useCreateUserOtp();

  const handleClose = () => {
    onClose();
    setFlow('start');
  };

  const value: IContext = useMemo(
    () => ({
      setFlow,
      flow,
      error,
      data,
      isLoading,
      trigger,
      handleClose
    }),
    [flow, data, error, trigger, isLoading]
  );

  return <TwoFactorAuthContext.Provider value={value}>{children}</TwoFactorAuthContext.Provider>;
}

export const useTwoFactorAuth = () => useContext(TwoFactorAuthContext);
