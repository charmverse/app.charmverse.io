import * as http from 'adapters/http';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse
} from 'lib/subscription/createCryptoSubscription';
import type {
  CreateProSubscriptionRequest,
  CreateProSubscriptionResponse
} from 'lib/subscription/createProSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateProSubscriptionRequest) {
    return http.POST<CreateProSubscriptionResponse>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscription | null>(`/api/spaces/${spaceId}/subscription`);
  }

  createCryptoSubscription(spaceId: string, payload: CreateCryptoSubscriptionRequest) {
    return http.POST<CreateCryptoSubscriptionResponse>(`/api/spaces/${spaceId}/crypto-subscription`, payload);
  }
}
