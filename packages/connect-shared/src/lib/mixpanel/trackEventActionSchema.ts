import * as yup from 'yup';

export type EventType =
  | 'page_view'
  | 'create_project'
  | 'click_dont_have_farcaster_account'
  | 'click_join_the_sunnys'
  | 'click_share_on_warpcast'
  | 'click_share_on_twitter'
  | 'click_powered_by_charmverse'
  | 'click_need_help';

export const eventSchema = yup.object().shape({
  event: yup.string<EventType>().required(),
  isAnonymous: yup.boolean(),
  currentPageTitle: yup.string(),
  currentDomain: yup.string(),
  currentUrlPath: yup.string(),
  currentUrlSearch: yup.string()
});
export type Payload = yup.InferType<typeof eventSchema>;
