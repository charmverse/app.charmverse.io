import { Octokit } from '@octokit/core';
import { throttling } from '@octokit/plugin-throttling';

// we need to use octokit core to use the throttling plugin
Octokit.plugin(throttling);

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);

      if (retryCount < 1) {
        // only retries once
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      // does not retry, only logs a warning
      octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
    }
  }
});

export function getClient() {
  return octokit.graphql.defaults({});
}
