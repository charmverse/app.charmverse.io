import Mixpanel from 'mixpanel';
import { MixpanelEvent, MixpanelEventName } from './interfaces/index';

const mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY as string);

function track<T extends MixpanelEventName> (eventName: T, params: MixpanelEvent[T]) {
  mixpanelInstance.track(eventName, params);
}

export const mixpanel = {
  track
};
