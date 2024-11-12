export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
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

export type MixpanelEventMap = {
  sign_up: BaseEvent;
  sign_in: BaseEvent;
  nft_purchase: NftPurchaseEvent;
  connect_github_success: BaseEvent;
  click_scout_button: ClickScoutButton;
  click_moxie_promo: FrontendEvent;
  click_optimism_promo: FrontendEvent;
  page_view: FrontendEvent;
};

export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
