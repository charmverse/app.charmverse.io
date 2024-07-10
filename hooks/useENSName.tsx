import { getAddress } from 'viem';

import { useEnsName as useEnsNameWagmi } from './wagmi';

export const useENSName = (account: string | null | undefined): string | null | undefined => {
  const address = account ? (getAddress(account) as `0x${string}`) : undefined;

  const { data } = useEnsNameWagmi({ address });

  return data;
};
