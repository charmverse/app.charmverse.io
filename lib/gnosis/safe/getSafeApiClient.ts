import type ISafeApiKit from '@safe-global/api-kit';
import { getChainById } from 'connectors/chains';

/**
 * Api client for readonly Gnosis Safe operations
 */
export async function getSafeApiClient({ chainId }: { chainId: number }): Promise<ISafeApiKit> {
  const SafeApiKit = (await import('@safe-global/api-kit')).default;
  const txServiceUrl = getChainById(chainId)?.gnosisUrl;

  return new SafeApiKit({
    chainId: BigInt(chainId),
    txServiceUrl: txServiceUrl ? `${txServiceUrl}/api` : undefined
  });
}
