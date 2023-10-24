import { ethereumTypesConfig } from './chainComponents/ethereum/ethereumTypesConfig';

import { isAddress } from 'viem';
import { RPCList } from 'connectors';

type LitChainConfig = {
  value: string;
  label: string;
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
    nativeToken: chain.nativeCurrency.symbol,
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => isAddress(walletAddress)
  })
);
