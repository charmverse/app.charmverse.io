import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from '@root/lib/metrics/mixpanel/interfaces';
import * as yup from 'yup';

export const pageViewSchema = yup.object().shape({
  event: yup.string<MixpanelEventName>().required(),
  isAnonymous: yup.boolean(),
  currentPageTitle: yup.string(),
  currentDomain: yup.string(),
  currentUrlPath: yup.string(),
  currentUrlSearch: yup.string()
});

export type Payload = yup.InferType<typeof pageViewSchema>;
