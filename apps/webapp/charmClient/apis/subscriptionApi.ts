import type { Space } from '@charmverse/core/prisma-client';
import * as http from '@packages/adapters/http';
import type {
  CreatePaymentMethodRequest,
  CreatePaymentMethodResponse
} from '@packages/lib/subscription/createPaymentMethod';
import type {
  SpaceSubscriptionRequest,
  SpaceSubscriptionWithStripeData
} from '@packages/lib/subscription/getActiveSpaceSubscription';
import type { CouponDetails } from '@packages/lib/subscription/getCouponDetails';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  CreateProSubscriptionRequest,
  SubscriptionPaymentIntent
} from '@packages/lib/subscription/interfaces';
import type { UpdatePaymentMethodRequest } from '@packages/lib/subscription/updatePaymentMethod';
import type { UpdateSubscriptionRequest } from '@packages/lib/subscription/updateProSubscription';
import type { UpgradeSubscriptionRequest } from '@packages/lib/subscription/upgradeProSubscription';

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
}
