import type ISafeApiKit from '@safe-global/api-kit';
import { getChainById } from 'connectors/chains';
/**
 * Api client for readonly Gnosis Safe operations
 */
export async function getSafeApiClient({ chainId }: { chainId: number }): Promise<ISafeApiKit> {
  let { default: SafeApiKit } = await import('@safe-global/api-kit');
  // For some reason, when running compiled js code in node or using tsx, SafeApiKit is nested in a second default property
  SafeApiKit = (SafeApiKit as any).default || SafeApiKit;
  const txServiceUrl = getChainById(chainId)?.gnosisUrl;

  return new SafeApiKit({
    chainId: BigInt(chainId),
    txServiceUrl: txServiceUrl ? `${txServiceUrl}/api` : undefined
  });
}
