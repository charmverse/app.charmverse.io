import { log } from '@charmverse/core/log';
import { useEffect, useState } from 'react';

import { useGetGithubApplicationData } from 'charmClient/hooks/spaces';
import { INSTALLATION_ID_COOKIE } from 'lib/github/constants';
import { deleteCookie, getCookie } from 'lib/utils/browser';

export const useGithubApp = ({ spaceId }: { spaceId: string }) => {
  const githubInstallationId = getCookie(INSTALLATION_ID_COOKIE);
  const [loading, setLoading] = useState(false);
  const { showMessage } = useSnackbar();
  const {
    data: githubApplicationData,
    mutate,
    isLoading: isLoadingGithubApplicationData
  } = useGetGithubApplicationData(spaceId);

  useEffect(() => {
    if (githubInstallationId) {
      setLoading(true);
      deleteCookie(INSTALLATION_ID_COOKIE);
      charmClient.spaces
        .connectWithGithubApplication({
          spaceId,
          installationId: githubInstallationId
        })
        .then(() => {
          showMessage('Github application connected successfully', 'success');
          mutate();
        })
        .catch(() => {
          showMessage('Failed to connect with Github application', 'error');
          log.error('Failed to connect with Github application', { spaceId, githubInstallationId });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [githubInstallationId]);

  return {
    githubApplicationData,
    isLoadingGithubApplicationData,
    isConnectingWithGithubApp: loading
  };
};
