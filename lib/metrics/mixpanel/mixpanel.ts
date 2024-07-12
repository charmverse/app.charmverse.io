import Mixpanel from 'mixpanel';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

const apiKey = typeof process.env.MIXPANEL_API_KEY === 'string' ? process.env.MIXPANEL_API_KEY : null;

if (apiKey) {
  mixpanelInstance = Mixpanel.init(apiKey);
}
export const mixpanel = mixpanelInstance;

let mixpanelInstanceOP: Mixpanel.Mixpanel | null = null;
const apiKeyOP = typeof process.env.OP_MIXPANEL_API_KEY === 'string' ? process.env.OP_MIXPANEL_API_KEY : null;

if (apiKeyOP) {
  mixpanelInstanceOP = Mixpanel.init(apiKeyOP);
}
export const mixpanelOP = mixpanelInstanceOP;

export function getApiKey() {
  if (!apiKey) {
    throw new Error('MIXPANEL_API_KEY is not set');
  }
  return apiKey;
}

export enum GroupKeys {
  PageId = 'Page Id',
  SpaceId = 'Space Id'
}
