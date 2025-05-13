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

export const usePaymentMethods = (
  {
    filterUSDCPaymentMethods = false,
    filterNativeTokens = false
  }: {
    filterUSDCPaymentMethods?: boolean;
    filterNativeTokens?: boolean;
  } = {
    filterUSDCPaymentMethods: false,
    filterNativeTokens: false
  }
) => {
  const [paymentMethods, refreshPaymentMethods] = useContext(PaymentMethodsContext);

  const filteredPaymentMethods = useMemo(() => {
    let _paymentMethods = paymentMethods;
    if (filterUSDCPaymentMethods) {
      _paymentMethods = _paymentMethods.filter((pm) => pm.tokenSymbol !== 'USDC');
    }
    if (filterNativeTokens) {
      _paymentMethods = _paymentMethods.filter((pm) => {
        return pm.contractAddress !== '0x0000000000000000000000000000000000000000';
      });
    }
    return _paymentMethods;
  }, [paymentMethods, filterUSDCPaymentMethods, filterNativeTokens]);

  return [filteredPaymentMethods, refreshPaymentMethods] as const;
};
