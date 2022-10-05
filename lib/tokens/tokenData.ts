import type { PaymentMethod } from '@prisma/client';
import type { CryptoCurrency, IChainDetails } from 'connectors';
import { TokenLogoPaths, CryptoCurrencyList, getChainById } from 'connectors';

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
export function getTokenMetaData ({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
  return new Promise((resolve, reject) => {

    if (!chainId || !contractAddress) {
      reject(new Error('Please provide a valid chainId and contractAddress'));
    }

    let baseUrl = '';
    try {
      baseUrl = getAlchemyBaseUrl(chainId);
    }
    catch (e: unknown) {
      reject(e);
    }

    http.POST(baseUrl, {
      jsonrpc: '2.0',
      method: 'alchemy_getTokenMetadata',
      headers: {
        'Content-Type': 'application/json'
      },
      params: [
        `${contractAddress}`
      ]
    }).then((data: any) => {
      if (data.error) {
        reject(data.error);
      }
      else {
        resolve(data.result as ITokenMetadata);
      }
    }).catch(error => {
      reject(error);
    });
  });
}

/**
 * Returns a standardised shape for either a contract address, or a native currency
 * @param paymentMethods Call this function from a component that can access the usePaymentMethods hook which provides available methods to search through
 */
export function getTokenInfo (paymentMethods: PaymentMethod[], symbolOrAddress: string): TokenInfo {

  const paymentMethod = paymentMethods.find(method => (
    method.contractAddress === symbolOrAddress || method.tokenSymbol === symbolOrAddress
  ));

  const tokenLogo = paymentMethod?.tokenLogo || TokenLogoPaths[symbolOrAddress as CryptoCurrency];
  const tokenSymbol = paymentMethod?.tokenSymbol || symbolOrAddress;
  const tokenName = paymentMethod?.tokenName || CryptoCurrencyList[symbolOrAddress as CryptoCurrency];

  const tokenInfo: TokenInfo = {
    tokenName,
    tokenSymbol,
    tokenLogo: tokenLogo as string,
    isContract: !!paymentMethod?.contractAddress
  };

  return tokenInfo;
}

type TokenAndChain = TokenInfo & { chain: IChainDetails, canonicalLogo: string };
type getTokenAndChainInfoFromPaymentsProps = { chainId: number, methods: PaymentMethod[], symbolOrAddress: string }

export function getTokenAndChainInfoFromPayments ({ chainId, methods, symbolOrAddress }: getTokenAndChainInfoFromPaymentsProps): TokenAndChain {
  const paymentMethod = methods.find(method => (
    method.contractAddress === symbolOrAddress || method.tokenSymbol === symbolOrAddress
  ));
  if (paymentMethod) {
    return getTokenAndChainInfo(paymentMethod);
  }
  else {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`No chain found for chainId: ${chainId}`);
    }
    return {
      chain,
      canonicalLogo: TokenLogoPaths[symbolOrAddress as CryptoCurrency],
      tokenName: CryptoCurrencyList[symbolOrAddress as CryptoCurrency],
      tokenSymbol: symbolOrAddress,
      tokenLogo: TokenLogoPaths[symbolOrAddress as CryptoCurrency],
      isContract: false
    };
  }
}

export function getTokenAndChainInfo (paymentMethod: PaymentMethod): TokenAndChain {
  const chain = getChainById(paymentMethod.chainId);
  if (!chain) {
    throw new Error(`No chain found for chainId: ${paymentMethod.chainId}`);
  }
  const tokenLogo = paymentMethod.tokenLogo || TokenLogoPaths[paymentMethod.tokenSymbol as CryptoCurrency];
  return {
    // prefer our standard iconUrl for native tokens that may have been saved to tokenInfo
    canonicalLogo: paymentMethod.contractAddress ? (tokenLogo || chain.iconUrl) : chain.iconUrl,
    chain,
    tokenName: paymentMethod.tokenName,
    tokenSymbol: paymentMethod.tokenSymbol,
    tokenLogo,
    isContract: !!paymentMethod.contractAddress
  };
}
