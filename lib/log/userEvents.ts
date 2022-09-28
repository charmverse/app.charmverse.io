import * as http from 'adapters/http';
import log from 'lib/log';

/**
 * Full JSON body available here
 * @see https://discord.com/developers/docs/resources/webhook#webhook-object-jsonform-params
 */
export interface IDiscordMessage {
  content: string;
}

/// ------ Event types
export type FunnelEvent = 'awareness' | 'acquisition' | 'activation' | 'revenue' | 'referral';

export type EventType = 'create_user' | 'create_workspace'| 'first_user_create_page' | 'first_workspace_create_page' | 'create_bounty' | 'first_user_create_bounty' | 'first_workspace_create_bounty' | 'join_workspace_from_link';

/// ------
/**
 * @origin the website from where this request originated
 */
export interface IEventToLog {
  funnelStage: FunnelEvent;
  eventType: EventType;
  message: string;
}

const isProdEnvironment = process.env.NODE_ENV === 'production';
const webhook = process.env.DISCORD_EVENTS_WEBHOOK;

export async function postToDiscord (eventLog: IEventToLog) {

  let message = `Event: ${eventLog.funnelStage.toUpperCase()} / ${eventLog.eventType}\r\n`;

  message += eventLog.message;

  log.debug('New event logged', message);

  if (isProdEnvironment === true && webhook) {

    try {
      const discordReponse = await http.POST<IDiscordMessage>(webhook, { content: message });
      return discordReponse;
    }
    catch (error) {
      log.warn('Error posting to discord', error);
    }

  }

}
