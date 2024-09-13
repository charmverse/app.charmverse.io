import * as yup from 'yup';

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
  frame_impression: ReferrerEvent & Partial<UserEvent> & { frame: FrameScreen };
  frame_click: UserEventWithReferrer & { action: FrameAction; frame: FrameScreen };
};

type WaitlistAppEventMap = {
  page_view: UserEvent & { page: string };
  login: UserEvent;
  logout: UserEvent;
};

export type WaitlistEventMap = FrameEventMap & WaitlistAppEventMap;

export type WaitlistEvent = keyof WaitlistEventMap;

export const eventSchema = yup.object().shape({
  event: yup.string<WaitlistEvent>().required(),
  payload: yup.object(),
  currentPageTitle: yup.string(),
  currentDomain: yup.string(),
  currentUrlPath: yup.string(),
  currentUrlSearch: yup.string()
});