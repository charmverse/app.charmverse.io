import { useRouter } from 'next/router';
import { PaymentMethod } from '@prisma/client';
import { createContext, useEffect, useState, useMemo, ReactNode, useContext } from 'react';
import charmClient from 'charmClient';
import { useCurrentSpace } from './useCurrentSpace';

export type PaymentMethodMap = Record<number, PaymentMethod []>

type IContext = [
  paymentMethods: PaymentMethodMap,
  setPaymentMethods: (paymentMethodMap: PaymentMethodMap) => void,
  refreshPaymentMethods: () => void,
]

export const PaymentMethodsContext = createContext<Readonly<IContext>>([
  {},
  () => undefined,
  () => {}
]);

export function PaymentMethodsProvider ({ children }: { children: ReactNode }) {

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodMap>({});
  const [space] = useCurrentSpace();

  useEffect(() => {
    refreshPaymentMethods();
  }, [space]);

  function refreshPaymentMethods () {
    if (space) {
      charmClient.listPaymentMethods(space.id)
        .then(_paymentMethods => {
          const methodsMappedToChain: PaymentMethodMap = _paymentMethods.reduce((map, paymentMethod) => {
            if (!map[paymentMethod.chainId]) {
              map[paymentMethod.chainId] = [];
            }
            map[paymentMethod.chainId].push(paymentMethod);
            return map;
          }, {} as PaymentMethodMap);
          setPaymentMethods(methodsMappedToChain);
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
