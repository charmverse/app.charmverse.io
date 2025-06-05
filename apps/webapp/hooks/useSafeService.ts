import type { IChainDetails } from '@packages/blockchain/connectors/chains';
import type SafeServiceClient from '@safe-global/api-kit';
import { useEffect, useState } from 'react';

import { useWeb3Account } from './useWeb3Account';

export function useSafeService({ network }: { network?: IChainDetails | null }) {
  const { provider } = useWeb3Account();
  const [safeService, setSafeService] = useState<SafeServiceClient | null>(null);

  useEffect(() => {
    const gnosisUrl = network?.gnosisUrl;
    if (!provider || !network || !gnosisUrl) return;

    import('@safe-global/api-kit').then((safeServiceClient) => {
      const SafeServiceClient = safeServiceClient.default;
      setSafeService(new SafeServiceClient({ txServiceUrl: gnosisUrl, chainId: BigInt(network.chainId) }));
    });
  }, [provider, network]);

  return safeService;
}
