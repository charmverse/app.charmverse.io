export type EventType = 'page_view' | 'login' | 'logout';

type FrameScreen =
  | 'join_waitlist_info'
  | 'join_waitlist_new_join'
  | 'join_waitlist_current_score'
  | `waitlist_level_${'up' | 'down'}`;

type FrameAction = 'click_whats_this' | 'join_waitlist' | 'click_share' | 'goto_app';

type ReferrerEvent = {
  referrerUserId: string;
};

type UserEvent = {
  userId: string;
};

type UserEventWithReferrer = ReferrerEvent & UserEvent;

type FrameEventMap = {
  frame_impression: ReferrerEvent & { frame: FrameScreen };
  frame_click: UserEventWithReferrer & { action: FrameAction; frame: FrameScreen };
};

type WaitlistAppEventMap = {
  page_view: UserEvent & { page: string };
  login: UserEvent;
  logout: UserEvent;
};

export type WaitlistEventMap = FrameEventMap & WaitlistAppEventMap;

export type WaitlistEvent = keyof WaitlistEventMap;
