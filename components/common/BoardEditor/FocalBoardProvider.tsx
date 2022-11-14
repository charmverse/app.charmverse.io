import { useCallback, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { publishDeletes, publishIncrementalUpdate } from 'components/common/BoardEditor/publisher';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useSocketClient';
import log from 'lib/log';
import type { WebsocketPayload } from 'lib/websockets/interfaces';

import store from './focalboard/src/store';
import { useAppDispatch } from './focalboard/src/store/hooks';
import { initialLoad } from './focalboard/src/store/initialLoad';

// load focalboard data when a workspace is selected
function FocalBoardWatcher ({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const space = useCurrentSpace();

  const { subscribe } = useWebSocketClient();

  useEffect(() => {
    log.debug('Load focalboard data');
    if (space) {
      dispatch(initialLoad({ spaceId: space.id }));
    }
  }, [space?.id]);

  const handleBlockUpdates = useCallback((value: WebsocketPayload<'blocks_updated' | 'blocks_created'>) => {
    publishIncrementalUpdate(value instanceof Array ? value : [value] as any);
  }, []);

  const handleBlockDeletes = useCallback((value: WebsocketPayload<'blocks_deleted'>) => {
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

export default function FocalBoardProvider ({ children }: { children: JSX.Element }) {

  return (
    <ReduxProvider store={store}>
      <FocalBoardWatcher>
        {children}
      </FocalBoardWatcher>
    </ReduxProvider>
  );
}
