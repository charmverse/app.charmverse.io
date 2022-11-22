
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { websocketsHost } from 'config/constants';
import log from 'lib/log';
import type { ClientMessage, ServerMessage, WebSocketMessage, WebSocketPayload } from 'lib/websockets/interfaces';
import { PubSub } from 'lib/websockets/pubSub';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

const socketHost = `${websocketsHost || ''}/`;

type LoggedMessage = { type: string, payload: any }

export type SocketConnection = Socket<{ message: (message: WebSocketMessage) => void }>;

type IContext = {
  sendMessage: (message: ClientMessage) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
  subscribe: <T extends ServerMessage['type']>(event: T, callback: (payload: WebSocketPayload<T>) => void) => () => void;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null,
  subscribe: () => () => null
});

let socket: SocketConnection;

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);

  const space = useCurrentSpace();

  const { current: eventFeed } = useRef(
    new PubSub<ServerMessage['type'], ServerMessage['payload']>()
  );

  const { user } = useUser();
  const { data: authResponse } = useSWRImmutable(user?.id, () => charmClient.socket()); // refresh when user

  useEffect(() => {

    if (space && authResponse) {
      connect(space.id, authResponse.authToken);
    }

    return () => {
      socket?.disconnect();
    };
  }, [space?.id, user?.id, authResponse]);

  function pushToMessageLog (message: LoggedMessage) {
    if (process.env.NODE_ENV === 'development') {
      // setMessageLog((prev) => [message, ...prev.slice(0, 50)]);
    }
  }

  async function connect (spaceId: string, authToken: string) {

    if (socket?.connected) {
      socket.disconnect();
    }
    socket = io(socketHost, {
      withCredentials: true
      // path: '/api/socket'
    }).connect();

    // add headers for AWS. see: https://socket.io/how-to/deal-with-cookies#nodejs-client-and-cookies
    // also https://stackoverflow.com/questions/72909155/socket-io-and-load-balancer-alb-aws
    socket.io.on('open', () => {
      socket.io.engine.transport.on('pollComplete', () => {
        const request = socket.io.engine.transport.pollXhr.xhr;
        const cookieHeader = request.getResponseHeader('set-cookie') as string[] | undefined;
        log.debug('open socket', { cookieHeader });
        if (!cookieHeader) {
          return;
        }
        cookieHeader.forEach(cookieString => {
          log.debug({ cookieString });
          if (cookieString.includes('AWSALB')) {
            const name = cookieString.split('=')[0];
            const value = cookieString.split('=')[1];
            socket.io.opts.extraHeaders ||= {};
            socket.io.opts.extraHeaders.cookie = `${name}=${value}`;
          }
        });
      });
    });

    socket.on('connect', () => {
      log.info('Socket client connected');
      pushToMessageLog({ type: 'connect', payload: 'Client connected' });
      socket.emit('message', {
        type: 'subscribe',
        payload: {
          spaceId,
          authToken
        }
      });
    });

    socket.on('message', message => {
      if (isServerMessage(message)) {
        // Key part when we relay messages from the server to consumers
        eventFeed.publish(message.type, message.payload);
        pushToMessageLog(message);
      }
    });

    socket.on('disconnect', () => {
      pushToMessageLog({ type: 'connect', payload: 'disconnected from websocket' });
    });

    socket.on('connect_error', (err) => {
      log.error('Socket error', err.message); // prints the message associated with the error
      pushToMessageLog({ type: 'error', payload: err.message });
    });

  }

  function sendMessage (message: ClientMessage) {
    pushToMessageLog(message);
    socket.emit('message', message);
  }

  function clearLog () {
    setMessageLog([]);
  }

  const value: IContext = useMemo(() => ({
    sendMessage,
    messageLog,
    clearLog,
    subscribe: eventFeed.subscribe as IContext['subscribe']
  }), [authResponse, messageLog]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

function isServerMessage (message: WebSocketMessage): message is ServerMessage {
  return Boolean(message?.type && message?.payload);
}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
