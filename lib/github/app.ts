import { App as OctoKitApp } from '@octokit/app';
import { Octokit } from 'octokit';

const App = OctoKitApp.defaults({
  Octokit
});

export const app = new App({
  appId: process.env.GITHUB_APP_ID as string,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY as string,
  webhooks: { secret: process.env.GITHUB_APP_WEBHOOK_SECRET as string }
});

// const octokit = await app.getInstallationOctokit(INSTALLATION_ID);
export function getAppForInstallation(installationId: number) {
  return app.getInstallationOctokit(installationId);
}
