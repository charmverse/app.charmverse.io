import type { AddressInfo } from 'net';

import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import { httpServer, socketServer } from '../websockets/app';
import { cleanup } from '../websockets/verifyCustomOrigin';

let client: Socket;
let httpServerAddr: AddressInfo;

/**
 * Setup WS & HTTP servers
 */
beforeAll((done) => {
  httpServer.listen(done);
  httpServerAddr = httpServer.address() as AddressInfo;
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
  client = io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
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

describe('basic socket.io example', () => {
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
