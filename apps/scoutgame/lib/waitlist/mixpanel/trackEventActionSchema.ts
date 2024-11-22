import * as yup from 'yup';

export type FrameScreen =
  | 'join_waitlist_info'
  | 'join_waitlist_new_join'
  | 'join_waitlist_current_score'
  | `waitlist_level_${'up' | 'down'}`;

type FrameAction = 'goto_scoutgame';

type ReferrerEvent = {
  referrerUserId: string;
};

type UserEvent = {
  userId: string;
};

type UserEventWithReferrer = ReferrerEvent & UserEvent;

export type WaitlistEventMap = {
  frame_impression: ReferrerEvent & Partial<UserEvent> & { frame: FrameScreen };
  frame_click: UserEventWithReferrer & { action: FrameAction; frame: FrameScreen };
};

export type WaitlistEvent = keyof WaitlistEventMap;

export const eventSchema = yup.object().shape({
  event: yup.string<WaitlistEvent>().required(),
  payload: yup.object(),
  currentPageTitle: yup.string(),
  currentDomain: yup.string(),
  currentUrlPath: yup.string(),
  currentUrlSearch: yup.string()
});
