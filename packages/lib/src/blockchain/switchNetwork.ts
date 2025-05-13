import { getChainById } from '@packages/blockchain/connectors/chains';
import { toHex } from 'viem';

/**
 * See
 * https://stackoverflow.com/a/68267546
 * @param chainId
 * @returns
 */
export async function switchActiveNetwork(chainId: number) {
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHex(chainId) }]
    });
  } catch (error: any) {
    // -32603 is from Coinbase wallet
    if (error.code === 4902 || error.code === -32603) {
      const chainInfo = getChainById(chainId);

      if (!chainInfo) {
        throw new Error('Unsupported chain');
      }
      const { chainName, nativeCurrency, rpcUrls, blockExplorerUrls } = chainInfo;
      return (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainName,
            nativeCurrency,
            rpcUrls,
            blockExplorerUrls,
            chainId: toHex(chainId)
          }
        ]
      });
    } else {
      throw error;
    }
  }
}
