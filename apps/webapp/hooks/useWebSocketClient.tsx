import { log } from '@charmverse/core/log';
import { websocketsHost } from '@packages/config/constants';
import type { ClientMessage, ServerMessage, WebSocketMessage, WebSocketPayload } from '@packages/websockets/interfaces';
import { PubSub } from '@packages/websockets/pubSub';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

const socketHost = `${websocketsHost || ''}/`;

type LoggedMessage = { type: string; payload: any };

export type SocketConnection = Socket<{ message: (message: WebSocketMessage) => void }>;

type IContext = {
  sendMessage: (message: ClientMessage) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
  subscribe: <T extends ServerMessage['type']>(
    event: T,
    callback: (payload: WebSocketPayload<T>) => void
  ) => () => void;
};

const WebSocketClientContext = createContext<Readonly<IContext>>({
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null,
  subscribe: () =>
    function () {
      return null;
    }
});

let socket: SocketConnection;

export function WebSocketClientProvider({ children }: { children: ReactNode }) {
  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);

  const { space } = useCurrentSpace();

  const { current: eventFeed } = useRef(new PubSub<ServerMessage['type'], ServerMessage['payload']>());
  const { showMessage } = useSnackbar();

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

  function pushToMessageLog(message: LoggedMessage) {
    if (process.env.NODE_ENV === 'development') {
      // setMessageLog((prev) => [message, ...prev.slice(0, 50)]);
    }
  }

  async function connect(spaceId: string, authToken: string) {
    if (socket?.connected) {
      socket.disconnect();
    }
    socket = io(socketHost, {
      withCredentials: true
      // path: '/api/socket'
    });

    socket.on('connect', () => {
      log.info('[ws] Client connected');
      pushToMessageLog({ type: 'connect', payload: 'Client connected' });
      socket.emit('message', {
        type: 'subscribe',
        payload: {
          spaceId,
          authToken
        }
      });
    });

    socket.on('message', (message) => {
      if (isServerMessage(message)) {
        // Key part when we relay messages from the server to consumers
        eventFeed.publish(message.type, message.payload);
        log.debug('[ws] Received event', message);
        pushToMessageLog(message);
      }
    });

    socket.on('disconnect', () => {
      pushToMessageLog({ type: 'connect', payload: 'disconnected from websocket' });
    });

    socket.on('connect_error', (error) => {
      log.warn('[ws] Connection error - maybe restarting?', { error });
      pushToMessageLog({ type: 'error', payload: error.message });
    });
  }

  function sendMessage(message: ClientMessage) {
    pushToMessageLog(message);
    if (!socket.connected) {
      log.warn('Tried to send websocket message without active connection', {
        ...message,
        spaceId: space?.id,
        userId: user?.id
      });
      showMessage('Action failed: websocket disconnected.');
    } else {
      socket.emit('message', message);
    }
  }

  function clearLog() {
    setMessageLog([]);
  }

  const value: IContext = useMemo(
    () => ({
      sendMessage,
      messageLog,
      clearLog,
      subscribe: eventFeed.subscribe as IContext['subscribe']
    }),
    [authResponse, messageLog]
  );

  return <WebSocketClientContext.Provider value={value}>{children}</WebSocketClientContext.Provider>;
}

function isServerMessage(message: WebSocketMessage): message is ServerMessage {
  return Boolean(message?.type && message?.payload);
}

export const useWebSocketClient = () => useContext(WebSocketClientContext);

export function emitSocketMessage<Data = any>(message: ClientMessage, cb?: (data: Data) => void) {
  // @ts-ignore cb can be passed
  socket?.emit('message', message, cb);
}
