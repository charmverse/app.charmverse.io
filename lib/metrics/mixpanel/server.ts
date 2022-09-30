import { capitalize } from 'lodash';
import Mixpanel from 'mixpanel';
import type { LoggedInUser } from 'models';
import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase, MixpanelUserProfile } from './interfaces/index';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

if (process.env.MIXPANEL_API_KEY) {
  mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY as string);
}

export function trackUserAction<T extends MixpanelEventName> (eventName: T, params: MixpanelEvent[T]) {
  const { userId, ...restParams } = params;

  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...restParams
  };
  const humanReadableEventName = eventNameToHumanFormat(eventName);

  try {
    mixpanelInstance?.track(humanReadableEventName, mixpanelTrackParams);
  }
  catch (e) {
    // Failed to send mixpanel event
  }
}

export function updateTrackUserProfile (user: LoggedInUser) {
  const profile: MixpanelUserProfile = {
    $created: user.createdAt,
    $name: user.username,
    discordConnected: !!user.discordUser,
    walletConnected: !!user.addresses.length,
    spaces: user.spaceRoles.map(sr => sr.spaceId)
  };

  mixpanelInstance?.people.set(user.id, profile);
}

// format event_name to Event name
function eventNameToHumanFormat (eventName: MixpanelEventName) {
  return capitalize(eventName.toLowerCase().replace('_', ' '));
}
