import * as http from 'adapters/http';
import { PaymentMethod } from '@prisma/client';
import { TokenLogoPaths, CryptoCurrency, CryptoCurrencyList, getChainById, IChainDetails } from 'connectors';

export interface ITokenMetadataRequest {
  chainId: number,
  contractAddress: string
}

export interface ITokenMetadata {
  decimals: number,
  name: string,
  symbol: string,
  logo?: string
}

export type TokenInfo = Pick<PaymentMethod, 'tokenName' | 'tokenSymbol' | 'tokenLogo'> & {isContract: boolean};

/**
 * Call external provider to get information about a specific cryptocurrency
 */
export function getTokenMetaData ({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
  return new Promise((resolve, reject) => {

    if (!chainId || !contractAddress) {
      reject(new Error('Please provide a valid chainId and contractAddress'));
    }

    const apiKey = process.env.ALCHEMY_API_KEY;

    const alchemyApis: Record<number, string> = {
      1: 'eth-mainnet',
      4: 'eth-rinkeby',
      5: 'eth-goerli',
      137: 'polygon-mainnet',
      80001: 'polygon-mumbai',
      42161: 'arb-mainnet'
    };

    const apiSubdomain = alchemyApis[chainId];

    if (!apiSubdomain) {
      reject(new Error('Chain not supported'));
      return;
    }

    const baseUrl = `https://${apiSubdomain}.g.alchemy.com/v2/${apiKey}`;

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

// /**
//  * Returns a standardised shape for either a contract address, or a native currency
//  * @param paymentMethods Call this function from a component that can access the usePaymentMethods hook which provides available methods to search through
//  */
//  export function getTokenInfoFromPayments (paymentMethods: PaymentMethod[], symbolOrAddress: string): TokenInfo {

//   const paymentMethod = paymentMethods.find(method => (
//     method.contractAddress === symbolOrAddress || method.tokenSymbol === symbolOrAddress
//   ));

//   if (paymentMethod) {
//     return getTokenInfo(paymentMethod);
//   }
//   else {
//     return {
//       tokenName: TokenLogoPaths[symbolOrAddress as CryptoCurrency],
//       tokenSymbol: symbolOrAddress,
//       tokenLogo: CryptoCurrencyList[symbolOrAddress as CryptoCurrency],
//       isContract: false
//     };
//   }
// }

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
      tokenName: TokenLogoPaths[symbolOrAddress as CryptoCurrency],
      tokenSymbol: symbolOrAddress,
      tokenLogo: CryptoCurrencyList[symbolOrAddress as CryptoCurrency],
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
    canonicalLogo: paymentMethod.contractAddress ? tokenLogo : (chain.iconUrl || tokenLogo),
    chain,
    tokenName: paymentMethod.tokenName,
    tokenSymbol: paymentMethod.tokenSymbol,
    tokenLogo,
    isContract: !!paymentMethod.contractAddress
  };
}
