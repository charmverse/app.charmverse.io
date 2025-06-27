import { Octokit } from '@octokit/core';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';
import { log } from '@packages/core/log';

const OctokitWithThrottling = Octokit.plugin(throttling, paginateRest, restEndpointMethods);

export const octokit = new OctokitWithThrottling({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    // @ts-ignore
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      if (retryCount < 2) {
        log.debug(`[Octokit] Retrying after ${retryAfter} seconds!`);
        // only retries twice
        return true;
      }
      return false;
    },
    // @ts-ignore
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      // does not retry, only logs a warning
      log.warn(
        `[Octokit] SecondaryRateLimit detected for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`
      );
      // try again
      return true;
    }
  }
});
