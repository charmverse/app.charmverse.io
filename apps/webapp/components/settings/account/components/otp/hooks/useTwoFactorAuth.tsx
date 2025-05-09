import type { CreateOtpResponse } from '@packages/profile/otp/createUserOtp';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { useCreateOtp } from 'charmClient/hooks/profile';

export type Screens = 'start' | 'link' | 'confirmation' | 'finish';

type IContext = {
  setFlow: (flow: Screens) => void;
  trigger: (extraArgument?: undefined, options?: any) => Promise<CreateOtpResponse | undefined>;
  flow: Screens;
  error?: Error;
  data?: CreateOtpResponse;
  isLoading: boolean;
};

const TwoFactorAuthContext = createContext<Readonly<IContext>>({
  flow: 'start',
  error: undefined,
  isLoading: false,
  data: undefined,
  setFlow: () => {},
  trigger: async () => undefined
});

export function TwoFactorAuthProvider({ children }: { children: ReactNode }) {
  const [flow, setFlow] = useState<Screens>('start');
  const { data, trigger, error, isMutating: isLoading } = useCreateOtp();

  const value: IContext = useMemo(
    () => ({
      setFlow,
      flow,
      error,
      data,
      isLoading,
      trigger
    }),
    [flow, data, error, trigger, isLoading]
  );

  return <TwoFactorAuthContext.Provider value={value}>{children}</TwoFactorAuthContext.Provider>;
}

export const useTwoFactorAuth = () => useContext(TwoFactorAuthContext);
