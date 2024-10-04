import { log } from '@charmverse/core/log';
import { Octokit } from '@octokit/core';
import { throttling } from '@octokit/plugin-throttling';

// we need to use octokit core to use the throttling plugin
// ref: https://octokit.github.io/rest.js/v19/#throttling
Octokit.plugin(throttling);

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      log.warn(`[Octokit] Request quota exhausted for request ${options.method} ${options.url}`);

      log.info(`[Octokit] Retrying after ${retryAfter} seconds!`);
      return true;
      // if (retryCount < 2) {
      //   // only retries twice
      //   return true;
      // }
    },
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

export function getClient() {
  return octokit.graphql.defaults({});
}
