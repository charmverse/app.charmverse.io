import charmClient from 'charmClient';
import { useRouter } from 'next/router';
import useSWRImmutable from 'swr/immutable';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export function useDiscordLogin (cleanRoutes?: boolean) {
  const router = useRouter();
  const isLogInWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';
  const { showMessage } = useSnackbar();
  const [user, setUser] = useUser();

  useSWRImmutable(isLogInWithDiscord ? [router.query.code, router.query.discord, router.query.type] : null, async () => {
    charmClient.loginWithDiscord({
      code: router.query.code as string
    }).then((loggedInUser) => {
      // This will fetch all the spaces of that user
      setUser(loggedInUser);
      if (cleanRoutes) {
        router.push(window.location.href.split('?')[0], undefined, { shallow: true });
      }
    }).catch(err => {
      showMessage(err.message ?? err.error ?? 'Something went wrong', 'error');
      // Remove the unnecessary query params
      setTimeout(() => {
        router.push('/');
      }, 1000);
    });
  });
}
