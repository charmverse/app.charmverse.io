import type { Address } from 'wagmi';
import { useEnsName as useEnsNameWagmi } from 'wagmi';

export const useENSName = (account: string | null | undefined): string | null | undefined => {
  const address = typeof account === 'string' ? (account as Address) : undefined;

  const { data } = useEnsNameWagmi({
    address
  });

  return data;
};
