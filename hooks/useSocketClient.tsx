import type { ReactNode } from 'react';
import { useRef, useEffect, createContext, useContext, useMemo, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import { socketsHost } from 'config/constants';
import log from 'lib/log';
import { typedKeys } from 'lib/utilities/objects';
import type { WebsocketEvent, WebsocketMessage } from 'lib/websockets/broadcaster';
import { WebsocketEvents } from 'lib/websockets/broadcaster';

import { useUser } from './useUser';

type LoggedMessage = { type: string, payload: any }

type EventFeed = {
  [E in WebsocketEvent]: BehaviorSubject<WebsocketMessage<E> | null>;
}

type IContext = {
  lastPong: string | null;
  isConnected: boolean;
  sendPing: () => void;
  sendMessage: (message: any) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
  eventFeed: EventFeed;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  lastPong: null,
  isConnected: false,
  sendPing: () => null,
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null,
  eventFeed: {} as any
});

let socket: Socket;

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);
  const [lastPong, setLastPong] = useState<string | null>(null);
  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);
  const { current: eventFeed } = useRef<EventFeed>(typedKeys(WebsocketEvents).reduce((acc, key) => {
    acc[key as WebsocketEvent] = new BehaviorSubject<WebsocketMessage | null>(null) as any;
    return acc;
  }, {} as EventFeed));

  const { user } = useUser();

  useEffect(() => {

    if (user) {
      connect();
    }

    return () => {
      socket?.disconnect();
      socket?.off();
    };
  }, [user]);

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
    });

    socket.on('message', (message: WebsocketMessage) => {
      const isValidMessage = !!message && eventFeed[message.type] !== undefined;

      if (isValidMessage) {
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

  function sendPing () {
    socket.emit('ping');
  }

  function sendMessage (message: WebsocketMessage) {
    pushToMessageLog(message);
    socket.emit('message', message);
  }

  function clearLog () {
    setMessageLog([]);
  }

  const value: IContext = useMemo(() => ({
    isConnected,
    lastPong,
    sendPing,
    sendMessage,
    messageLog,
    clearLog,
    eventFeed
  }), [isConnected, messageLog]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
