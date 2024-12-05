import type { ReferralPlatform } from '@charmverse/core/prisma';

export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
  platform?: ReferralPlatform;
}

export type BaseEvent = {
  userId: string;
};

export type NftPurchaseEvent = BaseEvent & {
  amount: number;
  builderPath: string;
  paidWithPoints: boolean;
  season: string;
};

type FrontendEvent = BaseEvent & {
  currentPageTitle: string;
  currentDomain: string;
  currentUrlPath: string;
  currentUrlSearch: string;
};

export type ClickScoutButton = FrontendEvent & {
  price: number;
  builderPath: string;
};

export type EventType =
  | 'page_view'
  | 'create_project'
  | 'click_dont_have_farcaster_account'
  | 'click_join_the_sunnys'
  | 'click_share_on_warpcast'
  | 'click_share_on_twitter'
  | 'click_powered_by_charmverse'
  | 'click_need_help'
  | 'copy_referral_link'
  | 'click_telegram_refer_friend_button';

export type MixpanelEventMap = {
  sign_up: BaseEvent;
  sign_in: BaseEvent;
  nft_purchase: NftPurchaseEvent;
  claim_points: BaseEvent;
  daily_claim: BaseEvent;
  daily_claim_streak: BaseEvent;
  connect_github_success: BaseEvent;
  click_scout_button: ClickScoutButton;
  click_moxie_promo: FrontendEvent;
  click_optimism_promo: FrontendEvent;
  page_view: FrontendEvent;
  referral_link_used: BaseEvent & {
    referralCode: string;
    referrerPath: string;
  };
} & Record<EventType, FrontendEvent>;

export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
