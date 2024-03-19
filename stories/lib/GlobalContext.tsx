import type { Space } from '@charmverse/core/prisma';
import type { LensConfig } from '@lens-protocol/react-web';
import { development, LensProvider } from '@lens-protocol/react-web';
import { bindings } from '@lens-protocol/wagmi';
import { Paper } from '@mui/material';
import type { Store } from '@reduxjs/toolkit';
import { wagmiConfig } from 'connectors/config';
import { useRef, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { spaces } from 'stories/lib/mockData';

import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { CurrentSpaceContext, type ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import { SpacesContext, type IContext as ISpacesContext } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';

const space = spaces[0];

const lensConfig: LensConfig = {
  bindings: bindings(wagmiConfig),
  environment: development
};

export function GlobalContext({
  children,
  reduxStore,
  currentSpace = space
}: {
  reduxStore?: Store;
  children: ReactNode;
  currentSpace?: Space;
}) {
  // mock the current space since it usually relies on the URL
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space: currentSpace
  });

  reduxStore =
    reduxStore ??
    mockStateStore([], {
      boards: {
        boards: []
      },
      comments: {
        comments: [],
        loadedCardComments: []
      }
    });

  const spacesContext = useRef<ISpacesContext>({
    spaces,
    memberSpaces: spaces,
    setSpace: () => {},
    setSpaces: () => {},
    isLoaded: true,
    createNewSpace: async () => ({} as any),
    isCreatingSpace: false
  });

  return (
    <UserProvider>
      <SpacesContext.Provider value={spacesContext.current}>
        <CurrentSpaceContext.Provider value={spaceContext.current}>
          <MembersProvider>
            <MemberPropertiesProvider>
              <ReduxProvider store={reduxStore}>
                <PagesProvider>
                  <LensProvider config={lensConfig}>
                    <Paper square>{children}</Paper>
                  </LensProvider>
                </PagesProvider>
              </ReduxProvider>
            </MemberPropertiesProvider>
          </MembersProvider>
        </CurrentSpaceContext.Provider>
      </SpacesContext.Provider>
    </UserProvider>
  );
}
