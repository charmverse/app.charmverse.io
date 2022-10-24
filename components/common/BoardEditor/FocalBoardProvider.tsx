import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import log from 'lib/log';

import store from './focalboard/src/store';
import { useAppDispatch } from './focalboard/src/store/hooks';
import { initialLoad } from './focalboard/src/store/initialLoad';

// load focalboard data when a workspace is selected
function FocalBoardWatcher ({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const [space] = useCurrentSpace();
  useEffect(() => {
    log.debug('Load focalboard data');
    if (space) {
      dispatch(initialLoad({ spaceId: space.id }));
    }
  }, [space?.id]);

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
