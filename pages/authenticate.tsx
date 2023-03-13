import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import ErrorPage from 'components/common/errors/ErrorPage';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { SystemError } from 'lib/utilities/errors';

export default function Authenticate() {
  const [error, setError] = useState<SystemError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const { validateMagicLink } = useFirebaseAuth();
  const { showMessage } = useSnackbar();

  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      validateMagicLink()
        .then(() => {
          showMessage('Logged in with email. Redirecting you now', 'success');
          router.push('/');
        })
        .catch((err) => {
          setError(err as any);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  if (error) {
    return (
      <ErrorPage message={error.message ?? 'Login failed'}>
        <Box sx={{ mt: 3 }}>
          <Link href='/'>Request new magic link</Link>
        </Box>
      </ErrorPage>
    );
  }

  return (
    <Box height='100%' display='flex' flexDirection='column'>
      {isLoading && <LoadingComponent label='Logging you in' />}
    </Box>
  );
}
