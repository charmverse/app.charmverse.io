export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
}

export type BaseEvent = {
  userId: string;
};

export type UserSignupEvent = BaseEvent & {
  displayName: string;
  path: string;
  fid?: number;
};

export type NftPurchaseEvent = BaseEvent & {
  amount: number;
  builderPath: string;
  paidWithPoints: boolean;
  season: string;
};

export type OpenCheckoutEvent = BaseEvent & {
  price: number;
  builderPath: string;
  currentUrlPath: string;
};

export interface UserEventMap {
  sign_up: UserSignupEvent;
  sign_in: BaseEvent;
  nft_purchase: NftPurchaseEvent;
  connect_github_success: BaseEvent;
  open_checkout: OpenCheckoutEvent;
}

export type MixpanelEventMap = UserEventMap;
export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
