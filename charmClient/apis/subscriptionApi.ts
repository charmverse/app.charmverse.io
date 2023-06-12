import * as http from 'adapters/http';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type {
  CreateCryptoSubscriptionResponse,
  CreatePaymentSubscriptionResponse,
  CreateSubscriptionRequest
} from 'lib/subscription/interfaces';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateSubscriptionRequest) {
    return http.POST<CreatePaymentSubscriptionResponse>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscription | null>(`/api/spaces/${spaceId}/subscription`);
  }

  createCryptoSubscription(spaceId: string, payload: CreateSubscriptionRequest) {
    return http.POST<CreateCryptoSubscriptionResponse>(`/api/spaces/${spaceId}/crypto-subscription`, payload);
  }

  // @TODO Delete this when all is done
  freeSpaceSubscription(spaceId: string) {
    return http.DELETE(`/api/spaces/${spaceId}/subscription`);
  }
}
