import { POST } from '@charmverse/core/http';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy';

import type { ITokenMetadata, ITokenMetadataRequest } from './tokenData';
/**
 * Ref: https://docs.alchemy.com/docs/how-to-get-token-metadata
 */
export function getTokenMetadata({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
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

    POST(baseUrl, {
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
