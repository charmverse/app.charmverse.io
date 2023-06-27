import type { Space } from '@charmverse/core/prisma-client';

import * as http from 'adapters/http';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  CreateProSubscriptionRequest,
  SubscriptionPaymentIntent
} from 'lib/subscription/interfaces';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateProSubscriptionRequest) {
    return http.POST<SubscriptionPaymentIntent>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId }: { spaceId: string }) {
    return http.GET<SpaceSubscriptionWithStripeData | null>(`/api/spaces/${spaceId}/subscription`);
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

  switchToFreeTier(spaceId: string) {
    return http.POST<Space>(`/api/spaces/${spaceId}/switch-to-free-tier`);
  }
}
