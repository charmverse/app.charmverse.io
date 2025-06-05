import * as http from '@packages/adapters/http';
import type { DowngradeSubscriptionRequest } from '@packages/subscriptions/downgradeSubscription';
import type { SubscriptionEvent } from '@packages/subscriptions/getSubscriptionEvents';
import type { CreateSubscriptionContributionRequest } from '@packages/subscriptions/recordSubscriptionContribution';
import type { UpgradeSubscriptionRequest } from '@packages/subscriptions/upgradeSubscription';

export class SubscriptionApi {
  cancelSubscription(spaceId: string) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/cancel`);
  }

  reactivateSubscription(spaceId: string) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/reactivate`);
  }

  recordSubscriptionContribution(spaceId: string, payload: CreateSubscriptionContributionRequest) {
    return http.POST(`/api/spaces/${spaceId}/subscriptions/contribution`, payload);
  }

  getSubscriptionEvents(spaceId: string) {
    return http.GET<SubscriptionEvent[]>(`/api/spaces/${spaceId}/subscriptions/events`);
  }

  upgradeSubscription(spaceId: string, payload: UpgradeSubscriptionRequest) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/upgrade`, payload);
  }

  downgradeSubscription(spaceId: string, payload: DowngradeSubscriptionRequest) {
    return http.POST<void>(`/api/spaces/${spaceId}/subscriptions/downgrade`, payload);
  }
}
