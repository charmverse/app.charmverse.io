import { useCallback, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { initialDatabaseLoad } from 'components/common/DatabaseEditor/store/databaseBlocksLoad';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { publishDeletes, publishIncrementalUpdate } from './publisher';
import store from './store';
import { useAppDispatch } from './store/hooks';

// load focalboard data when a workspace is selected
function DatabaseWatcher({ children }: { children: JSX.Element }) {
  const { subscribe } = useWebSocketClient();
  const dispatch = useAppDispatch();

  const handleBlockUpdates = useCallback((value: WebSocketPayload<'blocks_updated' | 'blocks_created'>) => {
    publishIncrementalUpdate(value instanceof Array ? value : ([value] as any));
  }, []);

  const handleBlockDeletes = useCallback((value: WebSocketPayload<'blocks_deleted'>) => {
    publishDeletes(value);
  }, []);

  const handleBlockRestores = useCallback(
    (value: WebSocketPayload<'pages_restored'>) => {
      value.forEach(({ id: pageId }) => {
        dispatch(initialDatabaseLoad({ pageId }));
      });
    },
    [dispatch]
  );

  useEffect(() => {
    const unsubscribeFromBlockUpdates = subscribe('blocks_updated', handleBlockUpdates);
    const unsubscribeFromNewBlocks = subscribe('blocks_created', handleBlockUpdates);
    const unsubscribeFromDeletes = subscribe('blocks_deleted', handleBlockDeletes);
    const unsubscribeFromRestores = subscribe('pages_restored', handleBlockRestores);

    return () => {
      unsubscribeFromBlockUpdates();
      unsubscribeFromNewBlocks();
      unsubscribeFromDeletes();
      unsubscribeFromRestores();
    };
  }, []);

  return children;
}

export function DatabaseProvider({ children }: { children: JSX.Element }) {
  return (
    <ReduxProvider store={store}>
      <DatabaseWatcher>{children}</DatabaseWatcher>
    </ReduxProvider>
  );
}
