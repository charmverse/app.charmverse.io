import * as http from 'adapters/http';
import type {
  CreateProSubscriptionRequest,
  CreateProSubscriptionResponse
} from 'lib/subscription/createProSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export class SubscriptionApi {
  createSubscription(payload: CreateProSubscriptionRequest) {
    return http.POST<CreateProSubscriptionResponse>('/api/subscription/subscribe', payload);
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscription | null>(`/api/spaces/${spaceId}/subscription`);
  }
}
