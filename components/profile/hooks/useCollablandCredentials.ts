import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export function useCollablandCredentials () {

  const router = useRouter();
  const [aeToken, setAeToken] = useLocalStorage('collab-token', '');

  // check for the token when user is redirected back from collab.land and save it to local storage
  const tokenFromUrl = typeof router.query.aeToken === 'string' ? router.query.aeToken : router.query.aeToken?.[0];

  useEffect(() => {
    if (tokenFromUrl) {
      setAeToken(tokenFromUrl || '');
      setUrlWithoutRerender(router.pathname, { aeToken: null });
    }
  }, [tokenFromUrl]);

  // use window.location to determine redirect URI, since we sometimes change the URL without updating next.js router (it triggers a rerender)
  function getCollablandLogin () {
    return `https://login-qa.collab.land?state=foobar&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0])}`;
  }

  return {
    aeToken: tokenFromUrl || aeToken,
    setAeToken,
    getCollablandLogin
  };
}
