import type { ReactNode } from 'react';
import { useEffect, createContext, useContext, useMemo, useState } from 'react';
import io from 'socket.io-client';

import { socketsHost, socketsPort } from 'config/constants';
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

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const socket = io(`${socketsHost}${socketsPort ? `:${socketsPort}` : ''}`);

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

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
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
