import * as http from 'adapters/http';

const webhookBaseUrl = 'https://discord.com/api/webhooks';

/**
 * Full JSON body available here
 * @see https://discord.com/developers/docs/resources/webhook#webhook-object-jsonform-params
 */
export interface IDiscordMessage {
  content: string
}

/// ------ Event types
export type FunnelEvent = 'awareness' | 'acquisition' | 'activation' | 'revenue' | 'referral'

export type EventType = 'first_user_create_page' | 'first_workspace_create_page' | 'create_user' | 'create_workspace' | 'join_from_link'

/// ------
/**
 * @origin the website from where this request originated
 */
export interface IEventToLog {
  funnelStage: FunnelEvent
  eventType: EventType
  message: string
}

export async function postToDiscord (eventLog: IEventToLog) {

  let message = `Event: ${eventLog.funnelStage.toUpperCase()} / ${eventLog.eventType}\r\n`;

  const isProdEnvironment = process.env.ENV === 'prod';

  message += eventLog.message;

  console.log('New event logged', message);

  if (isProdEnvironment === true) {

    const webhookIdentifier = process.env.DISCORD_APP_EVENTS_HOOK_TOKEN;

    const requestUrl = `${webhookBaseUrl}${webhookIdentifier}`;

    return http.POST<IDiscordMessage>(requestUrl, { content: message });
  }

}
