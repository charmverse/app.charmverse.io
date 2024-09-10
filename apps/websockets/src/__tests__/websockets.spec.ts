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
beforeAll((done) => {
  httpServer.listen(done);
  const httpServerAddr = httpServer.address() as AddressInfo;
  socketUrl = `http://[${httpServerAddr.address}]:${httpServerAddr.port}`;
});

/**
 *  Cleanup WS & HTTP servers
 */
afterAll((done) => {
  cleanup();
  httpServer.close(done);
});

/**
 * Run before each test
 */
beforeEach((done) => {
  // Setup
  // Do not hardcode server port and address, square brackets are used for IPv6
  client = io(socketUrl, {
    transports: ['websocket']
  });
  client.on('connect', () => {
    done();
  });
});

/**
 * Run after each test
 */
afterEach((done) => {
  // Cleanup
  if (client.connected) {
    client.disconnect();
  }
  done();
});

describe('Web Socket server', () => {
  test('should respond to a basic health check', async () => {
    const response = await request(socketUrl).get(`/socket.io/?EIO=4&transport=polling`).expect(200);
    expect(response.text).toEqual(expect.stringContaining('0{"sid":'));
  });

  test('should communicate', (done) => {
    client.on('connection', (socket) => {
      expect(socket).toBeDefined();
    });

    client.once('echo', (message) => {
      // Check that the message matches
      expect(message).toBe('Hello World');
      done();
    });

    // once connected, emit Hello World
    socketServer.emit('echo', 'Hello World');
  });
});
