import type { PaymentMethod } from '@prisma/client';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

type IContext = [
  paymentMethods: PaymentMethod[],
  setPaymentMethods: Dispatch<SetStateAction<PaymentMethod[]>>,
  refreshPaymentMethods: () => void,
]

export const PaymentMethodsContext = createContext<Readonly<IContext>>([
  [],
  () => undefined,
  () => {}
]);

export function PaymentMethodsProvider ({ children }: { children: ReactNode }) {

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const space = useCurrentSpace();

  useEffect(() => {
    refreshPaymentMethods();
  }, [space]);

  function refreshPaymentMethods () {
    if (space) {
      charmClient.listPaymentMethods(space.id)
        .then(_paymentMethods => {
          setPaymentMethods(_paymentMethods);
        })
        .catch(() => {});
    }
  }

  const value = useMemo(() => {
    return [paymentMethods, setPaymentMethods, refreshPaymentMethods] as const;
  }, [paymentMethods, space]);

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export const usePaymentMethods = () => useContext(PaymentMethodsContext);
