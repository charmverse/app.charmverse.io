import type { LensConfig } from '@lens-protocol/react-web';
import { development, LensProvider } from '@lens-protocol/react-web';
import { bindings } from '@lens-protocol/wagmi';
import { useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { spaces } from 'stories/lib/mockData';

import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { CurrentSpaceContext, type ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MembersProvider } from 'hooks/useMembers';
import { UserProvider } from 'hooks/useUser';

const space = spaces[0];

const lensConfig: LensConfig = {
  bindings: bindings(),
  environment: development
};
const reduxStore = mockStateStore([], {
  boards: {
    boards: []
  },
  comments: {
    comments: [],
    loadedCardComments: []
  }
});

export function GlobalContext({ children }: { children: ReactNode }) {
  // mock the current space since it usually relies on the URL
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space
  });
  return (
    <UserProvider>
      <CurrentSpaceContext.Provider value={spaceContext.current}>
        <MembersProvider>
          <Provider store={reduxStore}>
            <LensProvider config={lensConfig}>{children}</LensProvider>
          </Provider>
        </MembersProvider>
      </CurrentSpaceContext.Provider>
    </UserProvider>
  );
}
