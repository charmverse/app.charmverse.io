import { POST } from '@charmverse/core/http';
import { isTestEnv } from '@packages/config/constants';
import { getAlchemyBaseUrl } from '@packages/lib/blockchain/provider/alchemy/client';

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

    if (isTestEnv) {
      reject(new Error('Cannot fetch token metadata in test environment'));
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
