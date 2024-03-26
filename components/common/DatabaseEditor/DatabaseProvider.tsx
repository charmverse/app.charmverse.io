import { useCallback, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { publishDeletes, publishIncrementalUpdate } from './publisher';
import store from './store';
import { updateCards } from './store/cards';
import { initialDatabaseLoad } from './store/databaseBlocksLoad';
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

  const handlePageUpdates = useCallback(
    (value: WebSocketPayload<'pages_meta_updated'>) => {
      // pass all values in, in case some are cards
      const cards = value;
      dispatch(updateCards(cards.map((page) => ({ id: page.id, title: page.title }))));
    },
    [dispatch]
  );
  const handleBlockRestores = useCallback(
    (value: WebSocketPayload<'pages_restored'>) => {
      value.forEach(({ id: pageId }) => {
        dispatch(initialDatabaseLoad({ pageId }));
      });
    },
    [dispatch]
  );

  useEffect(() => {
    const listeners = [
      subscribe('blocks_updated', handleBlockUpdates),
      subscribe('blocks_created', handleBlockUpdates),
      subscribe('blocks_deleted', handleBlockDeletes),
      subscribe('pages_restored', handleBlockRestores),
      subscribe('pages_meta_updated', handlePageUpdates)
    ];

    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
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
