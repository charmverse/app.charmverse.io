import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { loginWithTelegram } from 'components/settings/account/components/TelegramLoginIframe';
import type { TelegramAccount } from '@packages/lib/telegram/interfaces';

import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export function useTelegramConnect() {
  const { updateUser } = useUser();
  const { showMessage } = useSnackbar();

  const { trigger: connectToTelegram, isMutating: isConnectingToTelegram } = useSWRMutation(
    '/telegram/connect',
    (_url, { arg }: Readonly<{ arg: TelegramAccount }>) => charmClient.connectTelegram(arg),
    {
      onSuccess(data) {
        updateUser({ telegramUser: data });
      },
      onError(err) {
        showMessage((err as any).message ?? 'Something went wrong', 'error');
      }
    }
  );

  async function connectTelegram() {
    loginWithTelegram(async (_telegramAccount: TelegramAccount) => {
      if (_telegramAccount) {
        await connectToTelegram(_telegramAccount);
      } else {
        showMessage('Something went wrong. Please try again', 'warning');
      }
    });
  }

  return {
    isConnectingToTelegram,
    connectTelegram
  };
}
