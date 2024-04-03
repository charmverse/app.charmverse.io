import { createNodeMiddleware } from 'octokit';

import { App } from './app';

const app = new App({
  appId: 123,
  privateKey: '__PRIVATE_KEY__',
  webhooks: { secret: 'mysecret' }
});

app.webhooks.on('issues.opened', ({ octokit, payload }) => {
  // console.log('issues.opened event received', payload);
  return octokit.rest.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    body: 'Hello, World!'
  });
});

export const middleware = createNodeMiddleware(app);
