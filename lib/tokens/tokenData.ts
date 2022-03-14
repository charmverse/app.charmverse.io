import * as http from 'adapters/http';

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
