import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from '@root/lib/metrics/mixpanel/interfaces';
import * as yup from 'yup';

export const schema = yup.object({
  event: yup.string<MixpanelEventName>().required(),
  path: yup.string().required(),
  url: yup.string().required(),
  isAnonymous: yup.boolean(),
  meta: yup.object()
});

export type Payload = yup.InferType<typeof schema>;
