import Mixpanel from 'mixpanel';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

if (typeof process.env.MIXPANEL_API_KEY === 'string') {
  mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY);
}

export const mixpanel = mixpanelInstance;

export const apiKey = typeof process.env.MIXPANEL_API_KEY === 'string' ? process.env.MIXPANEL_API_KEY : null;

export enum GroupKeys {
  PageId = 'Page Id'
}
