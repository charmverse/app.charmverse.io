import * as http from 'adapters/http';
import log from 'lib/log';

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;

export async function handleDiscordResponse<Response> (endpoint: string): Promise<{status: number, error: string, redirectLink?: string} | {status: 'success', data: Response}> {
  const discordApiHeaders: any = {
    headers: {
      Authorization: `Bot ${discordBotToken}`
    }
  };

  try {
    const response = await http.GET<Response>(endpoint, undefined, discordApiHeaders);
    return {
      status: 'success',
      data: response
    };
  }
  catch (err: any) {
    log.warn('Error from Discord', err);
    // The bot token is invalid
    if (err.code === 0) {
      return {
        status: 500,
        error: 'Something went wrong. Please try again'
      };
    }
    // Charmverse bot hasn't been added to server
    else if (err.code === 50001) {
      return {
        status: 400,
        error: 'Use this link to add Charmverse bot to your server',
        redirectLink: `https://discord.com/oauth2/authorize?scope=bot&client_id=${discordClientId}&permissions=0`
      };
    }
    // Guild doesn't exist
    else if (err.code === 10004) {
      return {
        status: 400,
        error: 'Unknown guild. Please make sure you\'re importing from the correct guild'
      };
    }
    // Unknown user
    else if (err.code === 10013) {
      return {
        status: 400,
        error: 'Unknown user. User doesn\'t exist in the guild'
      };
    }
    else {
      return {
        status: 500,
        error: 'Something went wrong. Please try again'
      };
    }
  }
}
