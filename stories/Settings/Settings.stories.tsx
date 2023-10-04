import { Paper } from '@mui/material';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { SettingsContent } from 'components/settings/SettingsContent';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import type { SettingsPath } from 'hooks/useSettingsDialog';
import type { IContext as ISpacesContext } from 'hooks/useSpaces';
import { SpacesContext } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';

import { spaces } from '../lib/mockData';

const space = spaces[0];

function Context({ children }: { children: ReactNode }) {
  // mock the current space since it usually relies on the URL
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space
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
              <Paper>{children}</Paper>
            </MemberPropertiesProvider>
          </MembersProvider>
        </CurrentSpaceContext.Provider>
      </SpacesContext.Provider>
    </UserProvider>
  );
}

function ShowSettingsProfile({ path }: { path: SettingsPath }) {
  const [activePath, setActivePath] = useState<SettingsPath | undefined>(path);
  function onClose() {}
  return (
    <Context>
      <SettingsContent activePath={activePath} onSelectPath={setActivePath} onClose={onClose} />
    </Context>
  );
}

export function MyAccount() {
  return <ShowSettingsProfile path='account' />;
}

export function MyProfile() {
  return <ShowSettingsProfile path='profile' />;
}

export function SpaceOverview() {
  return <ShowSettingsProfile path='space' />;
}

export function RolesAndPermissions() {
  return <ShowSettingsProfile path='roles' />;
}

export function Invites() {
  return <ShowSettingsProfile path='invites' />;
}

export function Import() {
  return <ShowSettingsProfile path='import' />;
}

export function API() {
  return <ShowSettingsProfile path='api' />;
}

export function billing() {
  return <ShowSettingsProfile path='subscription' />;
}

export default {
  title: 'Settings/Views',
  component: SettingsContent
};
