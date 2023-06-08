import { getChainById } from 'connectors';
import { toQuantity } from 'ethers';

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
      params: [{ chainId: toQuantity(chainId) }]
    });
  } catch (error: any) {
    if (error.code === 4902) {
      const chainInfo = getChainById(chainId);

      if (!chainInfo) {
        throw new Error('Unsupported chain');
      }

      return (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            ...chainInfo,
            chainId: toQuantity(chainInfo?.chainId)
          }
        ]
      });
    } else {
      throw error;
    }
  }
}
