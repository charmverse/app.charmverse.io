import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import { socketsHost } from 'config/constants';
import log from 'lib/log';
import type { WebsocketEvent, WebsocketMessage } from 'lib/websockets/interfaces';
import { WebsocketEvents } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type LoggedMessage = { type: string, payload: any }

type EventFeed = {
  [E in WebsocketEvent]: BehaviorSubject<WebsocketMessage<E> | null>;
}

type IContext = {
  sendMessage: (message: any) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
  eventFeed: EventFeed;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null,
  eventFeed: {} as any
});

let socket: Socket<{ message: (message: WebsocketMessage) => void }>;

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);

  const [space] = useCurrentSpace();

  const { current: eventFeed } = useRef<EventFeed>(WebsocketEvents.reduce((acc, key) => {
    acc[key] = new BehaviorSubject<WebsocketMessage | null>(null) as any;
    return acc;
  }, {} as EventFeed));

  const { user } = useUser();

  useEffect(() => {

    if (space) {
      connect();
    }

    return () => {
      socket?.disconnect();
      socket?.off();
    };
  }, [space, user]);

  function pushToMessageLog (message: LoggedMessage) {
    if (process.env.NODE_ENV === 'development') {
      setMessageLog((prev) => [message, ...prev.slice(0, 50)]);
    }
  }

  async function connect () {
    await fetch('/api/socket');

    if (socket?.connected) {
      socket.disconnect();
    }

    socket = io(socketsHost, {
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
          spaceId: space!.id
        }
      });
    });

    socket.on('message', (message: WebsocketMessage) => {
      const isValidMessage = !!message && eventFeed[message.type] !== undefined;

      if (isValidMessage) {
        // Key part when we relay messages from the server to consumers
        (eventFeed[message.type] as BehaviorSubject<WebsocketMessage>).next(message);
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
    eventFeed
  }), [messageLog]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
