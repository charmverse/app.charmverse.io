import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from 'octokit';

import { githubAppId, githubPrivateKey } from 'config/constants';

export function createOctokitApp(installationId: string) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: githubAppId,
      privateKey: githubPrivateKey,
      installationId
    }
  });
}
