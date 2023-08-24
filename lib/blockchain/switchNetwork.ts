import { getChainById } from 'connectors';
import { ethers } from 'ethers';

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
      params: [{ chainId: ethers.utils.hexValue(chainId) }]
    });
  } catch (error: any) {
    if (error.code === 4902) {
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
            chainId: ethers.utils.hexValue(chainId)
          }
        ]
      });
    } else {
      throw error;
    }
  }
}
