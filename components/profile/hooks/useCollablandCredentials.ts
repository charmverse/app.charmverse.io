import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { silentlyUpdateURL } from 'lib/browser';

export function useCollablandCredentials () {

  const router = useRouter();
  const [aeToken, setAeToken] = useLocalStorage('collab-token', '');

  const tokenFromUrl = typeof router.query.aeToken === 'string' ? router.query.aeToken : router.query.aeToken?.[0];

  useEffect(() => {
    if (tokenFromUrl) {
      setAeToken(tokenFromUrl || '');
      silentlyUpdateURL(window.location.href.split('?')[0]);
    }
  }, [tokenFromUrl]);

  function getCollablandLogin () {
    return `https://login-qa.collab.land?state=foobar&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0])}`;
  }

  return {
    aeToken: tokenFromUrl || aeToken,
    getCollablandLogin
  };
}
