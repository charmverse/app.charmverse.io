import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useGetGithubApplicationData } from 'charmClient/hooks/spaces';
import Modal from 'components/common/Modal';
import { ConnectGithubRepoForm } from 'components/settings/integrations/components/ConnectGithubApp';
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

function ConnectGithubRepoFormWithApp({ spaceId, closeModal }: { spaceId: string; closeModal: VoidFunction }) {
  const { data, isLoading: isLoadingGithubApplicationData } = useGetGithubApplicationData(spaceId);
  if (!data || isLoadingGithubApplicationData) {
    return null;
  }

  return (
    <ConnectGithubRepoForm
      installationId={data.spaceGithubConnection.installationId}
      spaceId={spaceId}
      repositories={data.repositories}
      rewardRepo={data.spaceGithubConnection.rewardsRepo}
      githubAppName={data.spaceGithubConnection.name}
      onSave={closeModal}
      hideDisconnect
    />
  );
}

export function GithubAppProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const githubInstallationId = getCookie(INSTALLATION_ID_COOKIE);
  const [loading, setLoading] = useState(false);
  const { showMessage } = useSnackbar();
  const [showGithubRepoConnectionModal, setShowGithubRepoConnectionModal] = useState(false);

  useEffect(() => {
    if (space?.id && githubInstallationId) {
      setLoading(true);
      setShowGithubRepoConnectionModal(true);
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

  return (
    <GithubAppContext.Provider value={value}>
      {children}
      {showGithubRepoConnectionModal && space && (
        <Modal
          open
          title='Connect Github repo'
          onClose={() => {
            setShowGithubRepoConnectionModal(false);
          }}
        >
          <ConnectGithubRepoFormWithApp
            spaceId={space.id}
            closeModal={() => {
              setShowGithubRepoConnectionModal(false);
            }}
          />
        </Modal>
      )}
    </GithubAppContext.Provider>
  );
}

export const useGithubApp = () => useContext(GithubAppContext);
