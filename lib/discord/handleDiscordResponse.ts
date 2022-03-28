import * as http from 'adapters/http';
import log from 'lib/log';

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export async function handleDiscordResponse<Response> (endpoint: string): Promise<{status: number, error: string} | {status: 'success', data: Response}> {
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
    // The bot token is invalid
    if (err.code === 0) {
      log.warn('Bot is unauthorized due to invalid token', err);
      return {
        status: 500,
        error: 'Something went wrong. Please try again'
      };
    }
    // Charmverse bot hasn't been added to server
    else if (err.code === 50001) {
      return {
        status: 400,
        error: 'Please add Charmverse bot to your server'
      };
    }
    // Guild doesn't exist
    else if (err.code === 10004) {
      return {
        status: 400,
        error: "Unknown guild. Please make sure you're importing from the correct guild"
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
