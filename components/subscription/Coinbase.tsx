import type { Space } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { useEffect } from 'react';
import CoinbaseCommerceButton from 'react-coinbase-commerce';
import 'react-coinbase-commerce/dist/coinbase-commerce-button.css';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import type { CreateCoinbasePaymentRequest } from 'lib/subscription/createCoinbasePayment';

const StyledButton = styled(CoinbaseCommerceButton)`
  background: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  padding: ${({ theme }) => theme.spacing(1.2, 2)};
  border-radius: ${({ theme }) => theme.spacing(0.4)};
  border: none;
`;

export function Coinbase({
  space,
  billing,
  usage,
  period
}: {
  space: Space;
  billing: { fullName: string; billingEmail: string; streetAddress: string };
  usage: CreateCoinbasePaymentRequest['usage'];
  period: CreateCoinbasePaymentRequest['period'];
}) {
  const {
    data: coinbaseData,
    trigger: createCharge,
    isMutating: isLoadingCoinbase
  } = useSWRMutation(
    `/api/spaces/${space.id}/subscription/coinbase`,
    (_url, { arg }: Readonly<{ arg: CreateCoinbasePaymentRequest }>) =>
      charmClient.subscription.createCoinbaseCharge(arg)
  );

  useEffect(() => {
    // @TODO Move this inside the new crypto button. When it will be clicked it will open the iframe
    createCharge({ spaceId: space.id, usage, period, ...billing });
  }, []);

  return <StyledButton disabled={!coinbaseData?.code || isLoadingCoinbase} chargeId={`${coinbaseData?.code}`} />;
}
