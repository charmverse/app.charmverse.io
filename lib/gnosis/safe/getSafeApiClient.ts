import SafeApiKit from '@safe-global/api-kit';
import { getChainById } from 'connectors/chains';

/**
 * Api client for readonly Gnosis Safe operations
 */
export function getSafeApiClient({ chainId }: { chainId: number }): SafeApiKit {
  const txServiceUrl = getChainById(chainId)?.gnosisUrl;

  return new SafeApiKit({
    chainId: BigInt(chainId),
    txServiceUrl: txServiceUrl ? `${txServiceUrl}/api` : undefined
  });
}
