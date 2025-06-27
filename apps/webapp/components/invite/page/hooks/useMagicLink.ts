import { log } from '@packages/core/log';
import { useRouter } from 'next/router';
import { useRef, useState, useEffect } from 'react';

import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useVerifyLoginOtp } from 'hooks/useVerifyLoginOtp';

import type { MagicLinkResponseStatus } from '../PageInviteLink';

export function useMagicLink({ error: ssrError }: { error?: 'error_invalid_page_id' } = {}) {
  const router = useRouter();
  const { requestMagicLinkViaFirebase, validateMagicLink, emailForSignIn } = useFirebaseAuth({
    authenticatePath: router.asPath
  });
  const sendingMagicLink = useRef(false);
  const [status, setStatus] = useState<MagicLinkResponseStatus | undefined>(ssrError ?? undefined);
  const { open: openVerifyOtpModal } = useVerifyLoginOtp();

  async function requestMagicLink(email: string) {
    if (status !== 'requesting_link') {
      sendingMagicLink.current = true;
      try {
        setStatus('requesting_link');
        await requestMagicLinkViaFirebase({ email, redirectUrl: window.location.pathname });
        setStatus('sent_link');
      } catch (error) {
        if ((error as any)?.code === 'auth/invalid_email') {
          setStatus('error_invalid_email');
          log.warn('Error requesting firebase magic link because of an invalid email', { error });
        } else {
          setStatus('error');
          log.error('Error requesting firebase magic link', { error });
        }
      }
    }
  }

  // attempt to validate email on first load
  useEffect(() => {
    async function init() {
      if (emailForSignIn && status === undefined) {
        try {
          setStatus('verifying_email');
          const data = await validateMagicLink(emailForSignIn);
          if (!data) {
            return;
          }
          // If connect to account without otp, we need to redirect user to the page else we open the otp modal
          if ('id' in data && data.id) {
            log.info('Magic link validated, redirect user to page');
            setStatus('verified_email');
            // refresh page to redirect user
            router.replace(router.asPath);
          } else if ('otpRequired' in data && data.otpRequired) {
            setStatus('verifying_otp');
            log.info('Magic link validated, opening the otp of the user');
            openVerifyOtpModal();
          }
        } catch (error) {
          log.error('Error validating firebase magic link', { error });
          if ((error as any)?.code === 'auth/invalid_action_code') {
            setStatus('error_invalid_code');
          } else {
            setStatus('error');
          }
        }
      }
    }
    init();
  }, [emailForSignIn, status]);

  return {
    requestMagicLink,
    validateMagicLink,
    status
  };
}
