import { development, LensProvider } from '@lens-protocol/react-web';
import { bindings as wagmiBindings } from '@lens-protocol/wagmi';
import { Box, Paper } from '@mui/material';
import { wagmiConfig } from '@packages/connectors/config';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { SettingsContent } from 'components/settings/components/SettingsContent';
import type { SettingsPath } from 'hooks/useSettingsDialog';
import { VerifyLoginOtpProvider } from 'hooks/useVerifyLoginOtp';

import { spaces as _spaces } from '../lib/mockData';

// clone spaces so we can mutate it
const spaces = [..._spaces].map((s) => ({ ...s }));
const space = spaces[0];

space.notificationToggles = {
  rewards: false
};

function ShowSettingsProfile({ path }: { path: SettingsPath }) {
  const [activePath, setActivePath] = useState<SettingsPath | undefined>(path);
  function onClose() {}
  function setUnsavedChanges() {}
  return (
    <GlobalContext currentSpace={space}>
      <LensProvider
        config={{
          bindings: wagmiBindings(wagmiConfig),
          environment: development
        }}
      >
        <VerifyLoginOtpProvider>
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
        </VerifyLoginOtpProvider>
      </LensProvider>
    </GlobalContext>
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

export function integrations() {
  return <ShowSettingsProfile path='integrations' />;
}

export default {
  title: 'Settings/Views',
  component: SettingsContent
};

API.parameters = {
  msw: {
    handlers: {
      spaces: http.get(`/api/spaces`, () => {
        return HttpResponse.json(spaces);
      })
    }
  }
};

MyAccount.parameters = {
  msw: {
    handlers: {
      otpCreate: http.post(`/api/profile/otp`, () => {
        return HttpResponse.json({ code: '12345678', uri: 'tot//', recoveryCode: '1233546546' });
      }),
      otpGet: http.get(`/api/profile/otp`, () => {
        return HttpResponse.json({ code: '12345678', uri: 'tot//' });
      }),
      otpActivate: http.put(`/api/profile/otp/activate`, () => {
        return HttpResponse.json({});
      }),
      otpRecoveryCode: http.put(`/api/profile/otp/recovery-code`, () => {
        return HttpResponse.json({ code: '1233546546' });
      })
    }
  }
};
