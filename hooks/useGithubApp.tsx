import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { INSTALLATION_ID_COOKIE } from 'lib/github/constants';
import { deleteCookie, getCookie } from 'lib/utils/browser';

import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

type IGithubAppContext = {
  loading: boolean;
};

export const GithubAppContext = createContext<Readonly<IGithubAppContext>>({
  loading: false
});

export function GithubAppProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const githubInstallationId = getCookie(INSTALLATION_ID_COOKIE);
  const [loading, setLoading] = useState(false);
  const { showMessage } = useSnackbar();

  useEffect(() => {
    if (space?.id && githubInstallationId) {
      setLoading(true);
      deleteCookie(INSTALLATION_ID_COOKIE);
      charmClient.spaces
        .connectWithGithubApplication({
          spaceId: space.id,
          installationId: githubInstallationId
        })
        .then(() => {
          showMessage('Github application connected successfully', 'success');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [space?.id, githubInstallationId]);

  const value = useMemo<IGithubAppContext>(() => ({ loading }), [loading]);

  return <GithubAppContext.Provider value={value}>{children}</GithubAppContext.Provider>;
}

export const useGithubApp = () => useContext(GithubAppContext);
