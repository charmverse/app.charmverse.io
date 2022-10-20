import type { ReactNode } from 'react';
import { useEffect, createContext, useContext, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import { socketsHost } from 'config/constants';
import log from 'lib/log';

import { useUser } from './useUser';

type LoggedMessage = { type: 'ping' | 'pong' | 'connect' | 'disconnect' | 'error', message: string }

type IContext = {
  lastPong: string | null;
  isConnected: boolean;
  sendPing: () => void;
  sendMessage: (message: any) => void;
  // Testing purposes
  messageLog: LoggedMessage[];
  clearLog: () => void;
}

const WebSocketClientContext = createContext<Readonly<IContext>>({
  lastPong: null,
  isConnected: false,
  sendPing: () => null,
  sendMessage: () => null,
  // Development only
  messageLog: [],
  clearLog: () => null
});

let socket: Socket;

export function WebSocketClientProvider ({ children }: { children: ReactNode }) {

  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);
  const [lastPong, setLastPong] = useState<string | null>(null);
  const [messageLog, setMessageLog] = useState<LoggedMessage[]>([]);

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
      setIsConnected(true);
      log.info('Socket client connected');
      setMessageLog((prev) => [{ type: 'connect', message: 'Socket client connected' }, ...prev]);
    });

    socket.on('message', (message) => {
      setMessageLog((prev) => [{ type: 'pong', message }, ...prev]);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setMessageLog((prev) => [{ type: 'disconnect', message: 'Socket client disconnected' }, ...prev]);
    });

    socket.on('pong', (msg) => {
      setMessageLog((prev) => [{ type: 'pong', message: msg }, ...prev]);
      setLastPong(new Date().toISOString());
    });

    socket.on('connect_error', (err) => {
      log.error('Socket error', err.message); // prints the message associated with the error
      setMessageLog((prev) => [{ type: 'error', message: err.message }, ...prev]);
    });

  }

  function sendPing () {
    socket.emit('ping');
  }

  function sendMessage (message: any) {
    setMessageLog((prev) => [{ type: 'ping', message }, ...prev]);
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
    clearLog
  }), [isConnected, messageLog]);

  return (
    <WebSocketClientContext.Provider value={value}>
      {children}
    </WebSocketClientContext.Provider>
  );

}

export const useWebSocketClient = () => useContext(WebSocketClientContext);
