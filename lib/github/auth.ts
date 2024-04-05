import { prisma } from '@charmverse/core/prisma-client';
import { App } from '@octokit/app';
import { Octokit } from 'octokit';

export function getSpaceGithubCredential({ spaceId }: { spaceId: string }) {
  return prisma.spaceGithubCredential.findFirst({
    where: {
      spaceId
    }
  });
}
const MyApp = App.defaults({
  Octokit
});
const app = new App({
  appId: 123,
  privateKey: '-----BEGIN PRIVATE KEY-----\n...',
  oauth: {
    clientId: '0123',
    clientSecret: '0123secret'
  },
  webhooks: {
    secret: 'secret'
  }
});
