import type { PaymentMethod } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useGetPaymentMethods } from 'charmClient/hooks/spaces';

import { useCurrentSpace } from './useCurrentSpace';

type IContext = [paymentMethods: PaymentMethod[], refreshPaymentMethods: () => void];

export const PaymentMethodsContext = createContext<Readonly<IContext>>([[], () => {}]);

export function PaymentMethodsProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { data: paymentMethods, mutate: mutatePaymentMethods } = useGetPaymentMethods(space?.id);

  const value = useMemo(() => {
    return [paymentMethods || [], mutatePaymentMethods] as const;
  }, [paymentMethods, mutatePaymentMethods]);

  return <PaymentMethodsContext.Provider value={value}>{children}</PaymentMethodsContext.Provider>;
}

export const usePaymentMethods = () => useContext(PaymentMethodsContext);
