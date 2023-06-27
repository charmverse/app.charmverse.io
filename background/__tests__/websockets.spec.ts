import type { Server as HttpServer } from 'http';
import { createServer } from 'http';
import type { AddressInfo } from 'net';

import { Server } from 'socket.io';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

let socket: Socket;
let httpServer: HttpServer;
let httpServerAddr: AddressInfo;
let ioServer: Server;

/**
 * Setup WS & HTTP servers
 */
beforeAll((done) => {
  httpServer = createServer().listen();
  httpServerAddr = httpServer.address() as AddressInfo;
  ioServer = new Server(httpServer);
  done();
});

/**
 *  Cleanup WS & HTTP servers
 */
afterAll((done) => {
  ioServer.close();
  httpServer.close();
  done();
});

/**
 * Run before each test
 */
beforeEach((done) => {
  // Setup
  // Do not hardcode server port and address, square brackets are used for IPv6
  socket = io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
    transports: ['websocket']
  });
  socket.on('connect', () => {
    done();
  });
});

/**
 * Run after each test
 */
afterEach((done) => {
  // Cleanup
  if (socket.connected) {
    socket.disconnect();
  }
  done();
});

describe('basic socket.io example', () => {
  test('should communicate', (done) => {
    // once connected, emit Hello World
    ioServer.emit('echo', 'Hello World');
    socket.once('echo', (message) => {
      // Check that the message matches
      expect(message).toBe('Hello World');
      done();
    });
    ioServer.on('connection', (mySocket) => {
      expect(mySocket).toBeDefined();
    });
  });
  test('should communicate with waiting for socket.io handshakes', (done) => {
    // Emit sth from Client do Server
    socket.emit('examlpe', 'some messages');
    // Use timeout to wait for socket.io server handshakes
    setTimeout(() => {
      // Put your server side expect() here
      done();
    }, 50);
  });
});
