import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import charmClient from 'charmClient';
import log from 'lib/log';
import type { WebsocketEvent, WebsocketMessage, WebsocketPayload } from 'lib/websockets/interfaces';
import { WebsocketEvents } from 'lib/websockets/interfaces';
import { PubSub } from 'lib/websockets/pubSub';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type LoggedMessage = { type: string, payload: any }

type IContext = {
  sendMessage: (message: WebsocketMessage) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
  subscribe: <T extends WebsocketEvent>(event: T, callback: (payload: WebsocketPayload<T>) => void) => () => void;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null,
  subscribe: () => () => null
});

let socket: Socket<{ message: (message: WebsocketMessage) => void }>;

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);

  const space = useCurrentSpace();

  const { current: eventFeed } = useRef(new PubSub<WebsocketEvent, WebsocketPayload>());

  const { user } = useUser();

  useEffect(() => {

    if (space) {
      connect();
    }

    return () => {
      socket?.disconnect();
      socket?.off();
    };
  }, [space?.id, user?.id]);

  function pushToMessageLog (message: LoggedMessage) {
    if (process.env.NODE_ENV === 'development') {
      setMessageLog((prev) => [message, ...prev.slice(0, 50)]);
    }
  }

  async function connect () {
    const { authToken } = await charmClient.socket();

    if (socket?.connected) {
      socket.disconnect();
    }

    socket = io(window.location.origin, {
      withCredentials: true
      // path: '/api/socket'
    }).connect();

    socket.on('connect', () => {
      log.info('Socket client connected');
      pushToMessageLog({ type: 'connect', payload: 'Client connected' });

      socket.emit('message', {
        type: 'subscribe',
        payload: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          spaceId: space!.id,
          authToken
        }
      });
    });

    socket.on('message', (message: WebsocketMessage) => {
      const isValidMessage = !!message && WebsocketEvents.includes(message.type);

      if (isValidMessage) {
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

  function sendMessage (message: WebsocketMessage) {
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
    // Wrapper exists as there was an issue directly exporting the function itself
    subscribe: <T extends WebsocketEvent>(event: T, callback: (payload: WebsocketPayload<T>) => void) => eventFeed.subscribe(event, callback)
  }), [messageLog]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
