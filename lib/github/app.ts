import { createAppAuth } from '@octokit/auth-app';
import { githubAppId, githubPrivateKey } from '@root/config/constants';
import { Octokit } from 'octokit';

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
