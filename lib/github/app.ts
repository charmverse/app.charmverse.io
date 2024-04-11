import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from 'octokit';

import { githubAppId } from 'config/constants';

export function createOctokitApp(installationId: string) {
  const decodedGithubPrivateKey = Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY!, 'base64').toString('utf8');
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: githubAppId,
      privateKey: decodedGithubPrivateKey,
      installationId
    }
  });
}
