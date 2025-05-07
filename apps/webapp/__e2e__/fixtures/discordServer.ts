import type { Server } from 'http';
import type { AddressInfo } from 'net';

import type { Fixtures } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { createServer } from '../utils/mockServer';

// A dummy server that pretends to be the Discord API

export type DiscordServerDetails = {
  discordUserId: string;
  host: string;
};

// kind of hacky way to extract the interface for fixture
type DiscordServer = Fixtures<{ discordServer: DiscordServerDetails }>['discordServer'];

// eslint-disable-next-line no-empty-pattern
export const discordServer: DiscordServer = async ({}, use, workerInfo) => {
  const discordUserId = uuid();

  // Start the server.
  const { listen, router } = createServer();

  // Mock discord auth endpoints
  router.post('/oauth2/token', (ctx) => {
    ctx.body = { access_token: '123' };
  });

  router.get('/users/@me', (ctx) => {
    ctx.body = {
      id: discordUserId,
      username: 'disc0rd_user'
    };
  });

  router.get('/api/oauth2/authorize', (ctx) => {
    ctx.redirect(
      `http://localhost:3335/authenticate/discord?${encodeURI(
        'code=1234&state={"redirect":"http://localhost:3335/","type":"login"}'
      )}`
    );
  });

  const server = await listen(9000 + workerInfo.workerIndex);

  // Use the server in the tests.
  await use({
    discordUserId,
    host: getServerHost(server)
  });

  // Cleanup.
  await new Promise((done) => {
    server.close(done);
  });
};

function getServerHost(server: Server) {
  return `http://localhost:${(server.address() as AddressInfo).port}`;
}
