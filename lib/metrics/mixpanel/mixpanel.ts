
import Mixpanel from 'mixpanel';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

if (process.env.MIXPANEL_API_KEY) {
  mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY as string);
}

export const mixpanel = mixpanelInstance;

