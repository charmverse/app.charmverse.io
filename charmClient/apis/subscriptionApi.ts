import type { Space } from '@charmverse/core/prisma-client';
import * as http from '@root/adapters/http';
import type { CreateSubscriptionContributionRequest } from '@root/lib/subscription/createSubscriptionContribution';

import type { CreatePaymentMethodRequest, CreatePaymentMethodResponse } from 'lib/subscription/createPaymentMethod';
import type {
  SpaceSubscriptionRequest,
  SpaceSubscriptionWithStripeData
} from 'lib/subscription/getActiveSpaceSubscription';
import type { CouponDetails } from 'lib/subscription/getCouponDetails';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  CreateProSubscriptionRequest,
  SubscriptionPaymentIntent
} from 'lib/subscription/interfaces';
import type { UpdatePaymentMethodRequest } from 'lib/subscription/updatePaymentMethod';
import type { UpdateSubscriptionRequest } from 'lib/subscription/updateProSubscription';
import type { UpgradeSubscriptionRequest } from 'pages/api/spaces/[id]/upgrade-subscription';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateProSubscriptionRequest) {
    return http.POST<SubscriptionPaymentIntent & { email?: string }>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId }: SpaceSubscriptionRequest) {
    return http.GET<SpaceSubscriptionWithStripeData | null>(`/api/spaces/${spaceId}/subscription`);
  }

  createCryptoSubscription(spaceId: string, payload: CreateCryptoSubscriptionRequest) {
    return http.POST<CreateCryptoSubscriptionResponse>(`/api/spaces/${spaceId}/crypto-subscription`, payload);
  }

  updateSpaceSubscription(spaceId: string, payload: UpdateSubscriptionRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  switchToFreeTier(spaceId: string) {
    return http.POST<Space>(`/api/spaces/${spaceId}/switch-to-free-tier`);
  }

  switchToCommunityTier(spaceId: string) {
    return http.POST<Space>(`/api/spaces/${spaceId}/switch-to-community-tier`);
  }

  validateDiscount(spaceId: string, payload: { coupon: string }) {
    return http.POST<CouponDetails | null>(`/api/spaces/${spaceId}/validate-discount`, payload);
  }

  upgradeSpaceSubscription(spaceId: string, payload: UpgradeSubscriptionRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/upgrade-subscription`, payload);
  }

  createPaymentMethod(spaceId: string, payload: CreatePaymentMethodRequest) {
    return http.POST<CreatePaymentMethodResponse>(`/api/spaces/${spaceId}/payment-method`, payload);
  }

  updatePaymentMethod(spaceId: string, payload: UpdatePaymentMethodRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/payment-method`, payload);
  }

  checkSubscriptionContribution(spaceId: string, payload: { contributionId: string }) {
    return http.GET<void>(`/api/spaces/${spaceId}/subscription-contribution`, payload);
  }

  createSubscriptionContribution(spaceId: string, payload: CreateSubscriptionContributionRequest) {
    return http.POST<{ contributionId: string }>(`/api/spaces/${spaceId}/subscription-contribution`, payload);
  }

  getSubscriptionContributions(spaceId: string) {
    return http.GET<{ balance: string }>(`/api/spaces/${spaceId}/subscription-contributions`);
  }
}
