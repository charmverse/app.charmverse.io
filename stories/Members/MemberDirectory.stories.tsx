import { Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import MemberDirectoryComponent from 'components/members/MemberDirectoryPage';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import { UserProvider } from 'hooks/useUser';

import { spaces, memberProperties } from '../lib/mockData';

const space = spaces[0];

function Context({ children }: { children: ReactNode }) {
  // mock the current space since it usually relies on the URL
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space
  });
  return (
    <UserProvider>
      <PagesProvider>
        <CurrentSpaceContext.Provider value={spaceContext.current}>
          <MembersProvider>
            <MemberPropertiesProvider>
              <Paper>{children}</Paper>
            </MemberPropertiesProvider>
          </MembersProvider>
        </CurrentSpaceContext.Provider>
      </PagesProvider>
    </UserProvider>
  );
}

export function MemberDirectoryPage() {
  return (
    <Context>
      <MemberDirectoryComponent title='Member Directory' />
    </Context>
  );
}

MemberDirectoryPage.parameters = {
  msw: {
    handlers: {
      getMemberProperties: rest.get('/api/spaces/:spaceId/members/properties', (req, res, ctx) => {
        return res(ctx.json(memberProperties));
      })
    }
  }
};

export default {
  title: 'Members/Views',
  component: MemberDirectoryPage
};
