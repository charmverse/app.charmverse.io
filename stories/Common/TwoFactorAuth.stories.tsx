import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { rest } from 'msw';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { GetQrCodeModal } from 'components/settings/account/components/otp/components/GetQrCodeModal';
import { ResetRecoveryCodeModal } from 'components/settings/account/components/otp/components/ResetRecoveryCodeModal';
import { TwoFactorAuthSetupModal } from 'components/settings/account/components/otp/components/TwoFactorAuthSetupModal';

import { spaces as _spaces } from '../lib/mockData';

// clone spaces so we can mutate it
const spaces = [..._spaces].map((s) => ({ ...s }));
const space = spaces[0];

space.notificationToggles = {
  rewards: false
};

const mappedModals = {
  ResetRecoveryCodeModal,
  TwoFactorAuthSetupModal,
  GetQrCodeModal
} as const;

function ShowModal({ modal }: { modal: keyof typeof mappedModals }) {
  function onClose() {}

  const Component = mappedModals[modal];

  return (
    <GlobalContext currentSpace={space}>
      <Box maxWidth='lg'>
        <Paper
          sx={{
            maxHeight: 800,
            height: { md: '90vh' }
          }}
        >
          <Component onClose={onClose} open={true} />
        </Paper>
      </Box>
    </GlobalContext>
  );
}

export function ResetRecoveryCodeModalStory() {
  return <ShowModal modal='ResetRecoveryCodeModal' />;
}

export function TwoFactorAuthSetupModalStory() {
  return <ShowModal modal='TwoFactorAuthSetupModal' />;
}

export function GetQrCodeModalStory() {
  return <ShowModal modal='GetQrCodeModal' />;
}

export default {
  title: 'Common/TwoFactorAuth',
  component: ShowModal
};

ResetRecoveryCodeModalStory.parameters = {
  msw: {
    handlers: {
      otpRecoveryCode: rest.put(`/api/profile/otp/recovery-code`, (_req, res, ctx) => {
        return res(ctx.json({ recoveryCode: '1233546546', code: '12354354', uri: 'tot//' }));
      })
    }
  }
};

TwoFactorAuthSetupModalStory.parameters = {
  msw: {
    handlers: {
      otpCreate: rest.post(`/api/profile/otp`, (_req, res, ctx) => {
        return res(ctx.json({ code: '12345678', uri: 'tot//', recoveryCode: '1233546546' }));
      }),
      otpActivate: rest.put(`/api/profile/otp/activate`, (_req, res, ctx) => {
        return res(ctx.json({}));
      })
    }
  }
};

GetQrCodeModalStory.parameters = {
  msw: {
    handlers: {
      otpGet: rest.get(`/api/profile/otp`, (_req, res, ctx) => {
        return res(ctx.json({ code: '12345678', uri: 'tot//' }));
      })
    }
  }
};
