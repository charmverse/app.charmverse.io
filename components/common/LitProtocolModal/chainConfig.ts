import { RPCList } from 'connectors';
import { isAddress } from 'viem';

import { ethereumTypesConfig } from './chainComponents/ethereum/ethereumTypesConfig';

export type LitChainConfig = {
  value: string;
  label: string;
  chainId: number;
  logo: string;
  nativeToken?: string;
  types: any;
  addressValidator: (walletAddress: string) => boolean;
};

export const chainConfig = RPCList.filter((chain) => chain.litNetwork).map(
  (chain): LitChainConfig => ({
    value: chain.litNetwork as string,
    label: chain.chainName,
    logo: chain.iconUrl,
    chainId: chain.chainId,
    nativeToken: chain.nativeCurrency.symbol,
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => isAddress(walletAddress)
  })
);
