import charmClient from 'charmClient';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export function useDiscordLogin () {
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const [_, setUser] = useUser();

  useEffect(() => {
    const isLogInWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';
    if (isLogInWithDiscord) {
      charmClient.loginWithDiscord({
        code: router.query.code as string
      })
        .then((loggedInUser) => {
          // This will fetch all the spaces of that user
          setUser(loggedInUser);
        })
        .catch(err => {
          showMessage(err.error ?? 'Something went wrong', 'error');
        });
    }
  }, []);
}
