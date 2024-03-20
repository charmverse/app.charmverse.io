import { useCallback, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { publishDeletes, publishIncrementalUpdate } from './publisher';
import store from './store';

// load focalboard data when a workspace is selected
function FocalBoardWatcher({ children }: { children: JSX.Element }) {
  const { subscribe } = useWebSocketClient();

  const handleBlockUpdates = useCallback((value: WebSocketPayload<'blocks_updated' | 'blocks_created'>) => {
    publishIncrementalUpdate(value instanceof Array ? value : ([value] as any));
  }, []);

  const handleBlockDeletes = useCallback((value: WebSocketPayload<'blocks_deleted'>) => {
    publishDeletes(value);
  }, []);

  useEffect(() => {
    const unsubscribeFromBlockUpdates = subscribe('blocks_updated', handleBlockUpdates);
    const unsubscribeFromNewBlocks = subscribe('blocks_created', handleBlockUpdates);
    const unsubscribeFromDeletes = subscribe('blocks_deleted', handleBlockDeletes);

    return () => {
      unsubscribeFromBlockUpdates();
      unsubscribeFromNewBlocks();
      unsubscribeFromDeletes();
    };
  }, []);

  return children;
}

export default function FocalBoardProvider({ children }: { children: JSX.Element }) {
  return (
    <ReduxProvider store={store}>
      <FocalBoardWatcher>{children}</FocalBoardWatcher>
    </ReduxProvider>
  );
}
