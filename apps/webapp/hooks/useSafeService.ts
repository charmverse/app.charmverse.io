import type { IChainDetails } from '@packages/blockchain/connectors/chains';
import type SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { useWeb3Account } from './useWeb3Account';

export function useSafeService({ network }: { network?: IChainDetails | null }) {
  const { provider } = useWeb3Account();
  const [safeService, setSafeService] = useState<SafeServiceClient | null>(null);

  useEffect(() => {
    const gnosisUrl = network?.gnosisUrl;
    if (!provider || !network || !gnosisUrl) return;

    import('@safe-global/safe-ethers-lib').then((ethersAdapter) => {
      const EthersAdapter = ethersAdapter.default;
      const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: provider
      });

      import('@safe-global/api-kit').then((safeServiceClient) => {
        const SafeServiceClient = safeServiceClient.default;
        setSafeService(new SafeApiKit({ txServiceUrl: gnosisUrl, ethAdapter }));
      });
    });
  }, [provider, network]);

  return safeService;
}
