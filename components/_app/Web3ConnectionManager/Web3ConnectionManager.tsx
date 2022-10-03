// eslint-disable-next-line import/no-extraneous-dependencies
import type { AbstractConnector } from '@web3-react/abstract-connector';
import { useWeb3React } from '@web3-react/core';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { PropsWithChildren } from 'react';
import { createContext, useEffect, useState } from 'react';

import NetworkModal from 'components/common/PageLayout/components/Account/components/NetworkModal/NetworkModal';

import WalletSelectorModal from './components/WalletSelectorModal';
import useEagerConnect from './hooks/useEagerConnect';
import useInactiveListener from './hooks/useInactiveListener';

const Web3Connection = createContext({
  isWalletSelectorModalOpen: false,
  openWalletSelectorModal: () => { },
  closeWalletSelectorModal: () => { },
  triedEager: false,
  isNetworkModalOpen: false,
  openNetworkModal: () => { },
  closeNetworkModal: () => { }
});

function Web3ConnectionManager ({
  children
}: PropsWithChildren<any>) {
  const { connector, active } = useWeb3React();
  const {
    isOpen: isWalletSelectorModalOpen,
    open: openWalletSelectorModal,
    close: closeWalletSelectorModal
  } = usePopupState({ variant: 'popover', popupId: 'wallet-selector' });
  const {
    isOpen: isNetworkModalOpen,
    open: openNetworkModal,
    close: closeNetworkModal
  } = usePopupState({ variant: 'popover', popupId: 'network-selector' });
  const router = useRouter();

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState<AbstractConnector>();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // try to eagerly connect to an injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  useEffect(() => {
    if (
      triedEager
      && !active
      && (router.query.discordId || router.query.redirectUrl)
    ) openWalletSelectorModal();
  }, [triedEager, active, router.query]);

  return (
    <Web3Connection.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        isWalletSelectorModalOpen,
        openWalletSelectorModal,
        closeWalletSelectorModal,
        triedEager,
        isNetworkModalOpen,
        openNetworkModal,
        closeNetworkModal
      }}
    >
      {children}
      <WalletSelectorModal
        {...{
          setActivatingConnector,
          isModalOpen: isWalletSelectorModalOpen,
          openModal: openWalletSelectorModal,
          closeModal: closeWalletSelectorModal,
          openNetworkModal
        }}
      />
      <NetworkModal
        {...{ isOpen: isNetworkModalOpen, onClose: closeNetworkModal }}
      />
    </Web3Connection.Provider>
  );
}
export { Web3Connection, Web3ConnectionManager };
