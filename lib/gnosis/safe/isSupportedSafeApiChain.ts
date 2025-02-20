import { getChainById } from '@packages/connectors/chains';

export function isSupportedSafeApiChain(
  chainId: number
): { supported: false; serviceUrl: undefined } | { supported: true; serviceUrl: string } {
  const url = getChainById(chainId)?.gnosisUrl;

  if (url) {
    return {
      supported: true,
      serviceUrl: url
    };
  } else {
    return {
      supported: false,
      serviceUrl: undefined
    };
  }
}
