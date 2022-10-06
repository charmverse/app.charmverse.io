import type { Server } from 'http';
import type { AddressInfo } from 'net';

import type { Fixtures } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { createServer } from '../utils/mockServer';

// A dummy server that pretends to be the Discord API

export type WorkerFixture = {
  discordServer: Server;
}

// kind of hacky way to extract the interface for fixture
type DiscordServerFixture = Fixtures<any, WorkerFixture>['discordServer'];

// eslint-disable-next-line no-empty-pattern
export const discordServer: (userId?: string) => DiscordServerFixture = (userId = uuid()) => [async ({}, use, workerInfo) => {
  // Start the server.
  const { listen, router } = createServer();

  // Mock discord auth endpoints
  router.post('/oauth2/token', (ctx) => {
    ctx.body = { access_token: '123' };
  });

  router.get('/users/@me', ctx => {
    ctx.body = {
      id: userId,
      username: 'disc0rd_user'
    };
  });

  const server = await listen(9000 + workerInfo.workerIndex);

  // Use the server in the tests.
  await use(server);

  // Cleanup.
  await new Promise(done => {
    server.close(done);
  });
}, { scope: 'worker' }];

export function getServerHost (server: Server) {
  return `http://localhost:${(server.address() as AddressInfo).port}`;
}
