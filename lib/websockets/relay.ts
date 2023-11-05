import { WebsocketBroadcaster } from './broadcaster';
// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var relay: WebsocketBroadcaster | undefined;
}

export const relay = global.relay ?? new WebsocketBroadcaster();

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development') {
  global.relay = relay;
}
