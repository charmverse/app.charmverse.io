import * as http from 'adapters/http';
import type { SpaceSubscription } from 'lib/subscription/interfaces';
import type { CreatePaymentSubscriptionRequest, CreatePaymentSubscriptionResponse } from 'pages/api/payment/subscribe';

export class PaymentApi {
  createSubscription(payload: CreatePaymentSubscriptionRequest) {
    return http.POST<CreatePaymentSubscriptionResponse>('/api/payment/subscribe', payload);
  }

  getStripePublicKey() {
    return http.GET<{ publicKey: string }>('/api/payment/publicKey');
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscription | null>(`/api/spaces/${spaceId}/subscription`);
  }
}
