import { Box, Paper } from '@mui/material';
import { rest } from 'msw';
import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { SettingsContent } from 'components/settings/SettingsContent';
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
    }
  }
};

MyAccount.parameters = {
  msw: {
    handlers: {
      otpCreate: rest.post(`/api/profile/otp`, (_req, res, ctx) => {
        return res(ctx.json({ code: '12345678', uri: 'tot//', recoveryCode: '1233546546' }));
      }),
      otpGet: rest.get(`/api/profile/otp`, (_req, res, ctx) => {
        return res(ctx.json({ code: '12345678', uri: 'tot//' }));
      }),
      otpActivate: rest.put(`/api/profile/otp/activate`, (_req, res, ctx) => {
        return res(ctx.json({}));
      }),
      otpRecoveryCode: rest.put(`/api/profile/otp/recovery-code`, (_req, res, ctx) => {
        return res(ctx.json({ code: '1233546546' }));
      })
    }
  }
};
