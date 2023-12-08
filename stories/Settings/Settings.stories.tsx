import type { LensConfig } from '@lens-protocol/react-web';
import { LensProvider, development, production } from '@lens-protocol/react-web';
import { bindings } from '@lens-protocol/wagmi';
import { Box, Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { SettingsContent } from 'components/settings/SettingsContent';
import { isProdEnv } from 'config/constants';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';
import { MembersProvider } from 'hooks/useMembers';
import type { SettingsPath } from 'hooks/useSettingsDialog';
import type { IContext as ISpacesContext } from 'hooks/useSpaces';
import { SpacesContext } from 'hooks/useSpaces';
import { UserProvider } from 'hooks/useUser';

import { spaces as _spaces, userProfile } from '../lib/mockData';

// clone spaces so we can mutate it
const spaces = [..._spaces].map((s) => ({ ...s }));
const space = spaces[0];

space.notificationToggles = {
  rewards: false
};

const lensConfig: LensConfig = {
  bindings: bindings(),
  environment: isProdEnv ? production : development
};

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
              <LensProvider config={lensConfig}>{children}</LensProvider>
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
  function setUnsavedChanges() {}
  return (
    <Context>
      <Box maxWidth='lg'>
        <Paper
          sx={{
            maxHeight: 800,
            height: { md: '90vh' }
          }}
        >
          <SettingsContent
            activePath={activePath}
            onSelectPath={setActivePath}
            onClose={onClose}
            setUnsavedChanges={setUnsavedChanges}
          />
        </Paper>
      </Box>
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

export function proposals() {
  return <ShowSettingsProfile path='proposals' />;
}

export default {
  title: 'Settings/Views',
  component: SettingsContent
};

API.parameters = {
  msw: {
    handlers: {
      spaces: rest.get(`/api/spaces`, (req, res, ctx) => {
        return res(ctx.json(spaces));
      })
      // userProfile: rest.get('/api/profile', (req, res, ctx) => {
      //   const clone = { ...userProfile };
      //   clone.notificationToggles = [
      //     {
      //       exclude: 'forum'
      //     }
      //   ];
      //   return res(ctx.json(clone));
      // })
    }
  }
};
