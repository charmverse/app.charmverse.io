import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from '@root/lib/metrics/mixpanel/interfaces';
import * as yup from 'yup';

export const pageViewSchema = yup.object().shape({
  event: yup.string<MixpanelEventName>().required(),
  isAnonymous: yup.boolean(),
  current_page_title: yup.string(),
  current_domain: yup.string(),
  current_url_path: yup.string(),
  current_url_search: yup.string()
});

export type Payload = yup.InferType<typeof pageViewSchema>;
