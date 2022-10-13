import type { ReactNode } from 'react';
import { useEffect, createContext, useContext, useMemo, useState } from 'react';
import io from 'socket.io-client';

import { socketsHost } from 'config/constants';
import log from 'lib/log';

type IContext = {
  lastPong: string | null;
  isConnected: boolean;
  sendPing: () => void;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  lastPong: null,
  isConnected: false,
  sendPing: () => null
});

const socket = io(socketsHost, {
  withCredentials: true
});

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      log.info('Socket client connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('pong', () => {
      setLastPong(new Date().toISOString());
    });

    socket.on('connect_error', (err) => {
      log.error('Socket error', err.message); // prints the message associated with the error
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
      socket.off('connect_error');
    };
  }, []);

  function sendPing () {
    socket.emit('ping');
  }

  const value: IContext = useMemo(() => ({
    isConnected,
    lastPong,
    sendPing
  }), [isConnected]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
