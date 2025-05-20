import type { Space, SpaceSubscriptionTierChangeEvent } from '@charmverse/core/prisma-client';
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
import type { CreateProSubscriptionRequest, SubscriptionPaymentIntent } from '@packages/lib/subscription/interfaces';
import type { UpdatePaymentMethodRequest } from '@packages/lib/subscription/updatePaymentMethod';
import type { DowngradeSubscriptionRequest } from '@packages/subscriptions/downgradeSubscription';
import type { SubscriptionReceipt } from '@packages/subscriptions/getSubscriptionReceipts';
import type { CreateSubscriptionContributionRequest } from '@packages/subscriptions/recordSubscriptionContribution';
import type { UpgradeSubscriptionRequest } from '@packages/subscriptions/upgradeSubscription';

export class SubscriptionApi {
  createSubscription(spaceId: string, payload: CreateProSubscriptionRequest) {
    return http.POST<SubscriptionPaymentIntent & { email?: string }>(`/api/spaces/${spaceId}/subscription`, payload);
  }

  getSpaceSubscription({ spaceId }: SpaceSubscriptionRequest) {
    return http.GET<SpaceSubscriptionWithStripeData | null>(`/api/spaces/${spaceId}/subscription`);
  }

  switchToCommunityTier(spaceId: string) {
    return http.POST<Space>(`/api/spaces/${spaceId}/switch-to-community-tier`);
  }

  validateDiscount(spaceId: string, payload: { coupon: string }) {
    return http.POST<CouponDetails | null>(`/api/spaces/${spaceId}/validate-discount`, payload);
  }

  createPaymentMethod(spaceId: string, payload: CreatePaymentMethodRequest) {
    return http.POST<CreatePaymentMethodResponse>(`/api/spaces/${spaceId}/payment-method`, payload);
  }

  updatePaymentMethod(spaceId: string, payload: UpdatePaymentMethodRequest) {
    return http.PUT<void>(`/api/spaces/${spaceId}/payment-method`, payload);
  }

  cancelSubscription(spaceId: string) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/cancel`);
  }

  reactivateSubscription(spaceId: string) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/reactivate`);
  }

  recordSubscriptionContribution(spaceId: string, payload: CreateSubscriptionContributionRequest) {
    return http.POST(`/api/spaces/${spaceId}/subscriptions/contribution`, payload);
  }

  getSubscriptionReceipts(spaceId: string) {
    return http.GET<SubscriptionReceipt[]>(`/api/spaces/${spaceId}/subscriptions/receipts`);
  }

  upgradeSubscription(spaceId: string, payload: UpgradeSubscriptionRequest) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/upgrade`, payload);
  }

  downgradeSubscription(spaceId: string, payload: DowngradeSubscriptionRequest) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/downgrade`, payload);
  }

  getSubscriptionEvents(spaceId: string) {
    return http.GET<SpaceSubscriptionTierChangeEvent[]>(`/api/spaces/${spaceId}/subscriptions/events`);
  }
}
