import Mixpanel from 'mixpanel';
import type { MixpanelEvent, MixpanelEventName } from './interfaces/index';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

if (process.env.MIXPANEL_API_KEY) {
  mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY as string);
}

export function trackUserAction<T extends MixpanelEventName> (eventName: T, params: MixpanelEvent[T]) {
  mixpanelInstance?.track(eventName, params);
}

