import { providers } from 'ethers';

/**
 * This solution fixes ethers 5.7 not working with recent Next.js v14+ versions
 * https://github.com/ethers-io/ethers.js/issues/4469#issuecomment-1932145334
 */
export function getEthersProvider({ rpcUrl }: { rpcUrl: string }) {
  return new providers.JsonRpcProvider({
    url: rpcUrl as string,
    skipFetchSetup: true
  });
}
