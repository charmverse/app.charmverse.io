import * as http from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { RateLimit } from 'async-sema';

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export async function authenticatedRequest<T>(endpoint: string) {
  const discordApiHeaders: any = {
    headers: {
      Authorization: `Bot ${discordBotToken}`
    }
  };
  return http.GET<T>(endpoint, undefined, discordApiHeaders);
}

// requests per second = 35, timeUnit = 1sec
const rateLimiter = RateLimit(30);

export async function handleDiscordResponse<T>(
  endpoint: string
): Promise<{ status: number; error: string; redirectLink?: string } | { status: 'success'; data: T }> {
  try {
    await rateLimiter();
    const response = await authenticatedRequest<T>(endpoint);
    log.info(`[Discord API]: ${endpoint}`);
    return {
      status: 'success',
      data: response
    };
  } catch (err: any) {
    log.warn('Error from Discord', { error: err, endpoint });
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
        error: 'CharmVerse does not have access to the server'
      };
    }
    // Guild doesn't exist
    else if (err.code === 10004) {
      return {
        status: 400,
        error: "Unknown guild. Please make sure you're importing from the correct guild"
      };
    }
    // Unknown user
    else if (err.code === 10013) {
      return {
        status: 400,
        error: "Unknown user. User doesn't exist in the guild"
      };
    } else {
      return {
        status: 500,
        error: 'Something went wrong. Please try again'
      };
    }
  }
}
