import { useRouter } from 'next/router';
import { PaymentMethod } from '@prisma/client';
import { createContext, useEffect, useState, useMemo, ReactNode, useContext } from 'react';
import charmClient from 'charmClient';
import { useCurrentSpace } from './useCurrentSpace';

type PaymentMethodMap = Record<number, PaymentMethod []>

type IContext = [paymentMethods: PaymentMethodMap, setPaymentMethods: (paymentMethodMap: PaymentMethodMap) => void]

export const PaymentMethodsContext = createContext<Readonly<IContext>>([{}, () => undefined]);

export function PaymentMethodsProvider ({ children }: { children: ReactNode }) {

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodMap>({});
  const [space] = useCurrentSpace();

  useEffect(() => {
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
  }, [space]);

  const value = useMemo(() => [paymentMethods, setPaymentMethods] as const, [paymentMethods, space]);

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export const usePaymentMethods = () => useContext(PaymentMethodsContext);
