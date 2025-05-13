import type { ApolloClient } from '@apollo/client';
import { isDevEnv, isStagingEnv } from '@packages/utils/constants';
import { arbitrum, base, optimism, optimismSepolia, sepolia } from 'viem/chains';

import { ApolloClientWithRedisCache } from '../apolloClientWithRedisCache';
import type { EasSchemaChain } from '../connectors';

import type { ExternalCredentialChain } from './schemas';

// For a specific profile, only refresh attestations every half hour
const defaultEASCacheDuration = 1800;

const skipRedisCache = isStagingEnv || isDevEnv;

const optimismEasCacheKeyPrefix = 'optimism-easscan';
const sepoliaEasCacheKeyPrefix = 'sepolia-easscan';
const optimismSepoliaEasCacheKeyPrefix = 'optimism-sepolia-easscan';
const baseEasCacheKeyPrefix = 'base-easscan';
const arbitrumEasCacheKeyPrefix = 'arbitrum-easscan';

export const optimismEasGraphqlUri = 'https://optimism.easscan.org/graphql';
export const sepoliaEasGraphqlUri = 'https://sepolia.easscan.org/graphql';
export const optimismSepoliaEasGraphqlUri = 'https://optimism-sepolia.easscan.org/graphql';
export const baseEasGraphqlUri = 'https://base.easscan.org/graphql';
export const arbitrumEasGraphqlUri = 'https://arbitrum.easscan.org/graphql';

export const easGraphQlClients: Record<ExternalCredentialChain | EasSchemaChain, ApolloClient<any>> = {
  [optimism.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: optimismEasCacheKeyPrefix,
    uri: optimismEasGraphqlUri,
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache
  }),
  [sepolia.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: sepoliaEasCacheKeyPrefix,
    uri: sepoliaEasGraphqlUri,
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache
  }),
  [optimismSepolia.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: optimismSepoliaEasCacheKeyPrefix,
    uri: optimismSepoliaEasGraphqlUri,
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache
  }),
  [base.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: baseEasCacheKeyPrefix,
    uri: baseEasGraphqlUri,
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache
  }),
  [arbitrum.id]: new ApolloClientWithRedisCache({
    cacheKeyPrefix: arbitrumEasCacheKeyPrefix,
    uri: arbitrumEasGraphqlUri,
    persistForSeconds: defaultEASCacheDuration,
    skipRedisCache
  })
};
