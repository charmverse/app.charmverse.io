import type { Space } from '@charmverse/core/prisma-client';

import * as http from 'adapters/http';
import type {
  SpaceSubscriptionRequest,
  SpaceSubscriptionWithStripeData
} from 'lib/subscription/getActiveSpaceSubscription';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  CreateProSubscriptionRequest,
  SubscriptionPaymentIntent
} from 'lib/subscription/interfaces';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';
import type { UpgradeSubscriptionRequest } from 'pages/api/spaces/[id]/upgrade-subscription';
import type { ValidatedCoupon } from 'pages/api/spaces/[id]/validate-discount';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateProSubscriptionRequest) {
    return http.POST<SubscriptionPaymentIntent & { email?: string }>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId, returnUrl }: SpaceSubscriptionRequest) {
    return http.GET<SpaceSubscriptionWithStripeData | null>(
      `/api/spaces/${spaceId}/subscription?returnUrl=${returnUrl}`
    );
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

  validateDiscount(spaceId: string, payload: { coupon: string }) {
    return http.POST<void>(`/api/spaces/${spaceId}/validate-discount`, payload);
  }

  upgradeSpaceSubscription(spaceId: string, payload: UpgradeSubscriptionRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/upgrade-subscription`, payload);
  }
}
