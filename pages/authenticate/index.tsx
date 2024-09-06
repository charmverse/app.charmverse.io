import Box from '@mui/material/Box';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { getLayout } from 'components/common/BaseLayout/getLayout';
import { Button } from 'components/common/Button';
import { EmailAddressFormDialog } from 'components/login/components/EmailAddressForm';
import { LoginButton } from 'components/login/components/LoginButton';
import { VerifyLoginOtpModal } from 'components/login/components/VerifyLoginOtpModal';
import { LoginPageContent } from 'components/login/LoginPageContent';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useVerifyLoginOtp } from 'hooks/useVerifyLoginOtp';
import { isValidEmail } from 'lib/utils/strings';

export default function Authenticate() {
  const [loginError, setLoginError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isLoaded: isUserLoaded, user } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const { validateMagicLink, emailForSignIn, setEmailForSignIn } = useFirebaseAuth();
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const emailPopup = usePopupState({ variant: 'popover', popupId: 'emailPopup' });
  const { close: closeVerifyOtp, isOpen: isVerifyOtpOpen, open: openVerifyOtpModal } = useVerifyLoginOtp();

  async function redirectLoggedInUser() {
    const redirectPath = typeof router.query.redirectUrl === 'string' ? router.query.redirectUrl : '/';

    // Use spaces might not be loaded yet, this ensures we have up to date data
    const userSpaces = await charmClient.spaces.getSpaces();

    const domainFromRedirect = redirectPath.split('/')[1];

    if (domainFromRedirect === 'invite') {
      // If the user is invited to a space, we should redirect them to that invite link
      router.push(redirectPath);
    } else if (userSpaces?.length && domainFromRedirect && userSpaces.find((s) => s.domain === domainFromRedirect)) {
      // If the user is a member of the space domain, we should redirect them to that space
      router.push(redirectPath);
    } else if (userSpaces?.length) {
      // If the user is a member of any space and not the domain above, we should redirect them to their first space where they have access
      router.push({ pathname: `/[domain]`, query: { domain: userSpaces[0].domain } });
    } else {
      // If the user is not a member of any space, we should redirect them to create a space
      router.push('/createSpace');
    }
  }

  // Case where existing user is adding an email to their account
  async function loginViaEmail() {
    if (!emailForSignIn) {
      return;
    }

    setIsAuthenticating(true);

    await validateMagicLink(emailForSignIn)
      .then((data) => {
        if (!data) {
          return;
        }
        if ('id' in data) {
          showMessage('Logged in with email. Redirecting you now', 'success');
          redirectLoggedInUser();
        } else if ('otpRequired' in data) {
          openVerifyOtpModal();
        }
      })
      .catch((err) => {
        if (user) {
          showMessage(err.message ?? 'Invalid invite link', 'error');
          setTimeout(() => {
            redirectLoggedInUser();
          }, 1500);
        } else {
          setIsAuthenticating(false);
          setLoginError(true);
          showMessage('Invalid invite link', 'error');
        }
      });
  }

  useEffect(() => {
    if (isUserLoaded && isSpacesLoaded) {
      if (emailForSignIn && isValidEmail(emailForSignIn)) {
        loginViaEmail();
      } else if (!loginError && !isAuthenticating) {
        emailPopup.open();
      }
    }
  }, [isUserLoaded, emailForSignIn, isSpacesLoaded]);

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
          {showLoginButton && <LoginButton emailOnly showSignup={false} />}

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
        </Box>
      </LoginPageContent>

      <EmailAddressFormDialog
        title='Login with your email'
        description='Please enter the email address on which you received the login link.'
        isOpen={emailPopup.isOpen}
        handleSubmit={submitEmail}
      />
      <VerifyLoginOtpModal open={isVerifyOtpOpen} onClose={closeVerifyOtp} />
    </Box>
  );
}
