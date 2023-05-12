import * as http from 'adapters/http';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type {
  CreatePaymentSubscriptionRequest,
  CreatePaymentSubscriptionResponse
} from 'pages/api/subscription/subscribe';

export class SubscriptionApi {
  createSubscription(payload: CreatePaymentSubscriptionRequest) {
    return http.POST<CreatePaymentSubscriptionResponse>('/api/subscription/subscribe', payload);
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscription | null>(`/api/spaces/${spaceId}/subscription`);
  }
}
