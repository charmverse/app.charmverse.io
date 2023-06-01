import { log } from '@charmverse/core/log';
import type { PaymentMethod } from '@charmverse/core/prisma';
import type { IChainDetails } from 'connectors';
import { getChainById } from 'connectors';

import * as http from 'adapters/http';
import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy';

import type { SupportedChainId } from '../blockchain/provider/alchemy';

export interface ITokenMetadataRequest {
  chainId: SupportedChainId;
  contractAddress: string;
}

export interface ITokenMetadata {
  decimals: number;
  name: string;
  symbol: string;
  logo?: string;
}

export type TokenInfo = Pick<PaymentMethod, 'tokenName' | 'tokenSymbol' | 'tokenLogo'> & { isContract: boolean };

/**
 * Call external provider to get information about a specific cryptocurrency
 */
export function getTokenMetaData({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
  return new Promise((resolve, reject) => {
    if (!chainId || !contractAddress) {
      reject(new Error('Please provide a valid chainId and contractAddress'));
    }

    let baseUrl = '';
    try {
      baseUrl = getAlchemyBaseUrl(chainId);
    } catch (e: unknown) {
      reject(e);
    }

    http
      .POST(baseUrl, {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenMetadata',
        headers: {
          'Content-Type': 'application/json'
        },
        params: [`${contractAddress}`]
      })
      .then((data: any) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result as ITokenMetadata);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

type TokenAndChain = TokenInfo & { chain: IChainDetails; canonicalLogo: string };
type getTokenInfoProps = { chainId?: number; methods: PaymentMethod[]; symbolOrAddress: string };

/**
 * Returns a standardised shape for either a contract address, or a native currency
 * @param methods Call this function from a component that can access the usePaymentMethods hook which provides available methods to search through
 */
export function getTokenInfo({ chainId = 1, methods, symbolOrAddress }: getTokenInfoProps): TokenAndChain {
  const paymentMethod = methods.find(
    (method) => method.contractAddress === symbolOrAddress || method.tokenSymbol === symbolOrAddress
  );
  if (paymentMethod) {
    return getTokenAndChainInfo(paymentMethod);
  } else if (chainId) {
    const chain = getChainById(chainId);
    if (chain) {
      return {
        chain,
        canonicalLogo: chain.iconUrl,
        tokenName: chain.nativeCurrency.name,
        tokenSymbol: symbolOrAddress,
        tokenLogo: chain.iconUrl,
        isContract: false
      };
    }
  }
  // default to ETH
  log.error(`No chain found when displaying token information, returning ETH defaults to user`, {
    chainId,
    methods,
    symbolOrAddress
  });
  const ethChain = getChainById(1)!;
  return {
    chain: ethChain,
    canonicalLogo: ethChain.iconUrl,
    tokenName: ethChain.nativeCurrency.name,
    tokenSymbol: symbolOrAddress,
    tokenLogo: ethChain.iconUrl,
    isContract: false
  };
}

export function getTokenAndChainInfo(paymentMethod: PaymentMethod): TokenAndChain {
  const chain = getChainById(paymentMethod.chainId);
  if (!chain) {
    throw new Error(`No chain found for chainId: ${paymentMethod.chainId}`);
  }
  const tokenLogo = paymentMethod.tokenLogo || chain.iconUrl;
  return {
    // prefer our standard iconUrl for native tokens that may have been saved to tokenInfo
    canonicalLogo: paymentMethod.contractAddress ? tokenLogo || chain.iconUrl : chain.iconUrl,
    chain,
    tokenName: paymentMethod.tokenName,
    tokenSymbol: paymentMethod.tokenSymbol,
    tokenLogo,
    isContract: !!paymentMethod.contractAddress
  };
}
