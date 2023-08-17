import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import { Button } from 'components/common/Button';
import { LoginPageContent } from 'components/login';
import { CollectEmailDialog } from 'components/login/CollectEmail';
import { LoginButton } from 'components/login/LoginButton';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { isValidEmail } from 'lib/utilities/strings';

export default function Authenticate() {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isLoaded: isUserLoaded, user } = useUser();
  const { spaces } = useSpaces();
  const { validateMagicLink, emailForSignIn, setEmailForSignIn } = useFirebaseAuth();
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const emailPopup = usePopupState({ variant: 'popover', popupId: 'emailPopup' });

  // Case where existing user is adding an email to their account
  const redirectPath = typeof router.query.redirectUrl === 'string' ? router.query.redirectUrl : '/';

  function loginViaEmail() {
    setIsAuthenticating(true);
    validateMagicLink()
      .then(() => {
        showMessage('Logged in with email. Redirecting you now', 'success');
        router.push(redirectPath);
      })
      .catch((err) => {
        setIsAuthenticating(false);
        setError('Invalid invite link');
      });
  }

  useEffect(() => {
    if (isUserLoaded && emailForSignIn && isValidEmail(emailForSignIn)) {
      loginViaEmail();
    } else if (isUserLoaded && !error && !isAuthenticating) {
      emailPopup.open();
    }
  }, [isUserLoaded, emailForSignIn]);

  function submitEmail(email: string) {
    setIsAuthenticating(true);
    emailPopup.close();
    setEmailForSignIn(email);
  }

  const showLoginButton = !isAuthenticating && !emailPopup.isOpen && !emailPopup.isOpen && !user;

  const showAdditionalOptions = !!user && !showLoginButton && !isAuthenticating && !emailPopup.isOpen;

  if (!isUserLoaded) {
    return null;
  }
  return getLayout(
    <Box height='100%' display='flex' flexDirection='column'>
      <LoginPageContent hideLoginOptions isLoggingIn={isAuthenticating}>
        <Box gap={3} sx={{ maxWidth: '200px', display: 'flex', flexDirection: 'column', pt: 2 }}>
          {showLoginButton && <LoginButton showSignup={false} />}

          {showAdditionalOptions && (
            <>
              {user && !!spaces?.length && (
                <Button sx={{ width: '100%' }} href={`/${spaces[0].domain}`} color='primary'>
                  Go to my space
                </Button>
              )}
              {user && !spaces?.length && (
                <Button sx={{ width: '100%' }} href='/createSpace' color='primary'>
                  Create a space
                </Button>
              )}
            </>
          )}

          {error && (
            <Alert sx={{ width: 'fit-content' }} severity='error'>
              {error}
            </Alert>
          )}
        </Box>
      </LoginPageContent>

      <CollectEmailDialog
        title='Login with your email'
        description='Please enter the email address on which you received the login link.'
        isOpen={emailPopup.isOpen}
        handleSubmit={submitEmail}
      />
    </Box>
  );
}
