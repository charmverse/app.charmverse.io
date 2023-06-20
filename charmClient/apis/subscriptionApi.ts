import * as http from 'adapters/http';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  CreateProSubscriptionRequest,
  CreateProSubscriptionResponse,
  UpdateSubscriptionRequest
} from 'lib/subscription/interfaces';

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

  deleteSpaceSubscription(spaceId: string) {
    return http.DELETE<void>(`/api/spaces/${spaceId}/subscription`);
  }

  updateSpaceSubscription(spaceId: string, payload: UpdateSubscriptionRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/subscription`, payload);
  }
}
