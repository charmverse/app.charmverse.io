export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
}

export interface BaseEventWithoutGroup {
  userId: string;
}

export type UserSignupEvent = BaseEventWithoutGroup & {
  username: string;
  fid?: number;
};

export type UserLoginEvent = BaseEventWithoutGroup;

export type NftPurchaseEvent = BaseEventWithoutGroup & {
  amount: number;
  paidWithPoints: boolean;
  season: string;
};

export interface UserEventMap {
  sign_up: UserSignupEvent;
  sign_in: UserLoginEvent;
  nft_purchase: NftPurchaseEvent;
}

export type MixpanelEventMap = UserEventMap;
export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
