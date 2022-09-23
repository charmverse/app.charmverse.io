import type { Space } from '@prisma/client';
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

  mixpanelInstance?.track(eventName, mixpanelTrackParams);
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
