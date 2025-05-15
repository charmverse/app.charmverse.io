import type { AddressInfo } from 'net';

import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import request from 'supertest';

import { httpServer, socketServer } from '../app/server';
import { cleanup } from '../app/verifyCustomOrigin';

let client: Socket;
let socketUrl: string;

/**
 * Setup WS & HTTP servers
 */
beforeAll(async () => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => httpServer.listen(resolve));
  const httpServerAddr = httpServer.address() as AddressInfo;
  socketUrl = `http://[${httpServerAddr.address}]:${httpServerAddr.port}`;
});

/**
 *  Cleanup WS & HTTP servers
 */
afterAll(async () => {
  cleanup();
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => httpServer.close(resolve));
});

/**
 * Run before each test
 */
beforeEach(async () => {
  // Setup
  // Do not hardcode server port and address, square brackets are used for IPv6
  client = io(socketUrl, {
    transports: ['websocket']
  });
  await new Promise((resolve) => {
    client.on('connect', () => {
      resolve(undefined);
    });
  });
});

/**
 * Run after each test
 */
afterEach(() => {
  // Cleanup
  if (client.connected) {
    client.disconnect();
  }
});

describe('Web Socket server', () => {
  test('should respond to a basic health check', async () => {
    const response = await request(socketUrl).get(`/socket.io/?EIO=4&transport=polling`).expect(200);
    expect(response.text).toEqual(expect.stringContaining('0{"sid":'));
  });

  test('should communicate', async () => {
    client.on('connection', (socket) => {
      expect(socket).toBeDefined();
    });

    await new Promise((resolve) => {
      client.once('echo', (message) => {
        // Check that the message matches
        expect(message).toBe('Hello World');
        resolve(undefined);
      });

      // once connected, emit Hello World
      socketServer.emit('echo', 'Hello World');
    });
  });
});
