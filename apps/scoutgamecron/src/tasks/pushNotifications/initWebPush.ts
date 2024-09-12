import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import webPush from 'web-push';

export function initWebPush() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      throw new InvalidInputError('VAPID keys are not set');
    }
    webPush.setVapidDetails('https://scoutgame.xyz', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    log.info('Web push initialized');
  }
}
