import { useCallback, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { publishIncrementalUpdate } from 'components/common/BoardEditor/publisher';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useSocketClient';
import log from 'lib/log';
import type { BlockUpdate, WebsocketPayload } from 'lib/websockets/interfaces';

import store from './focalboard/src/store';
import { useAppDispatch } from './focalboard/src/store/hooks';
import { initialLoad } from './focalboard/src/store/initialLoad';

// load focalboard data when a workspace is selected
function FocalBoardWatcher ({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const [space] = useCurrentSpace();

  const { eventFeed } = useWebSocketClient();

  useEffect(() => {
    log.debug('Load focalboard data');
    if (space) {
      dispatch(initialLoad({ spaceId: space.id }));
    }
  }, [space?.id]);

  const handleBlockUpdate = useCallback((value: BlockUpdate) => {
    publishIncrementalUpdate([value as any]);
  }, []);

  useEffect(() => {
    eventFeed.subscribe<'block_updated', WebsocketPayload<'block_updated'>>('block_updated', handleBlockUpdate);

    return eventFeed.unsubscribe('block_updated', handleBlockUpdate as any);
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
