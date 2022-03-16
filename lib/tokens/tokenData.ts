import * as http from 'adapters/http';
import { PaymentMethodMap } from 'hooks/usePaymentMethods';
import { PaymentMethod } from '@prisma/client';
import { CryptoLogoPaths, CryptoCurrency, CryptoCurrencyList } from 'models/Currency';

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
 * Utility function for finding a specific method within a payment method map
 * @param paymentMethods Call this function from a component that can access the usePaymentMethods hook which provides available methods to search through
 */
export function getPaymentMethod (
  paymentMethods: PaymentMethodMap,
  contractAddressOrId: string,
  chainId?: number
): PaymentMethod | undefined {

  if (chainId) {
    return paymentMethods[chainId]?.find(paymentMethod => (
      paymentMethod.contractAddress === contractAddressOrId || paymentMethod.id === contractAddressOrId
    ));
  }

  const flattenedChainMethods: PaymentMethod [] = Object.values(paymentMethods)
    .reduce((_paymentMethods, chainPaymentMethods) => {
      _paymentMethods.push(...chainPaymentMethods);
      return _paymentMethods;
    }, []);

  return flattenedChainMethods.find(paymentMethod => (
    paymentMethod.contractAddress === contractAddressOrId || paymentMethod.id === contractAddressOrId
  ));

}

/**
 * Returns a standardised shape for either a contract address, or a native currency
 * @param paymentMethods Call this function from a component that can access the usePaymentMethods hook which provides available methods to search through
 */
export function getTokenInfo (paymentMethods: PaymentMethodMap, symbolOrAddress: string): Pick<PaymentMethod, 'tokenName' | 'tokenSymbol' | 'tokenLogo'> & {isContract: boolean} {
  const isContractAddress = symbolOrAddress.includes('0x');

  const contractDetails = isContractAddress ? getPaymentMethod(paymentMethods, symbolOrAddress) : undefined;

  const tokenLogo = isContractAddress
    ? contractDetails?.tokenLogo
    : CryptoLogoPaths[symbolOrAddress as CryptoCurrency];

  const tokenSymbol = isContractAddress ? (contractDetails?.tokenSymbol ?? symbolOrAddress) : symbolOrAddress;

  const tokenName = isContractAddress ? (contractDetails?.tokenName ?? '') : CryptoCurrencyList[symbolOrAddress as CryptoCurrency];

  const tokenInfo: Pick<PaymentMethod, 'tokenName' | 'tokenSymbol' | 'tokenLogo'> & {isContract: boolean} = {
    tokenName,
    tokenSymbol,
    tokenLogo: tokenLogo as string,
    isContract: isContractAddress
  };

  return tokenInfo;
}
