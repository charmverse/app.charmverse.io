import { capitalize } from 'lodash';
import Mixpanel from 'mixpanel';

import { isDev } from 'config/constants';
import type { LoggedInUser } from 'models';

import type { MixpanelEvent, MixpanelEventName, MixpanelTrackBase } from './interfaces/index';

let mixpanelInstance: Mixpanel.Mixpanel | null = null;

if (process.env.MIXPANEL_API_KEY && isDev) {
  mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_API_KEY as string);
}

export function trackUserAction<T extends MixpanelEventName> (eventName: T, params: MixpanelEvent[T]) {
  const { userId, ...restParams } = params;

  // map userId prop to distinct_id required by mixpanel to recognize the user
  const mixpanelTrackParams: MixpanelTrackBase = {
    distinct_id: userId,
    ...paramsToHumanFormat(restParams)
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
  const profile = {
    $created: user.createdAt,
    $name: user.username,
    'Is Connected to Discord': !!user.discordUser,
    'Is Connected via Wallet': !!user.wallets.length,
    'Workspaces Joined': user.spaceRoles.map(sr => sr.spaceId)
  };

  try {
    mixpanelInstance?.people.set(user.id, profile);
  }
  catch (e) {
    // Failed to update mixpanel profile
  }
}

// format event_name to Event name
export function eventNameToHumanFormat (eventName: MixpanelEventName) {
  return capitalize(eventName.toLowerCase().replaceAll('_', ' '));
}

export function paramToHumanFormat (param: string) {
  const paramSpaces = param.replace(/[A-Z]/g, l => ` ${l}`).trim();
  return paramSpaces.charAt(0).toUpperCase() + paramSpaces.slice(1);
}

export function paramsToHumanFormat (params: Record<string, any>) {
  const humanReadableParams: Record<string, any> = {};

  Object.keys(params).forEach(k => {
    const updatedKey = paramToHumanFormat(k);
    humanReadableParams[updatedKey] = params[k];
  });

  return humanReadableParams;
}
