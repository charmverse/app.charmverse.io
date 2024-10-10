import Mixpanel from 'mixpanel';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

const apiKey = typeof process.env.MIXPANEL_API_KEY === 'string' ? process.env.MIXPANEL_API_KEY : null;

if (apiKey) {
  mixpanelInstance = Mixpanel.init(apiKey);
}
export const mixpanel = mixpanelInstance;

export function getApiKey() {
  if (!apiKey) {
    throw new Error('MIXPANEL_API_KEY is not set');
  }
  return apiKey;
}
