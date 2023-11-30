import SafeApiKit from '@safe-global/api-kit';
import { getChainById } from 'connectors/chains';

/**
 * Api client for readonly Gnosis Safe operations
 * @param param0
 * @returns
 */
export function getSafeApiClient({ chainId }: { chainId: number }): SafeApiKit {
  const serviceUrl = getChainById(chainId)?.gnosisUrl;

  return new SafeApiKit({
    chainId: BigInt(chainId)
  });
}
