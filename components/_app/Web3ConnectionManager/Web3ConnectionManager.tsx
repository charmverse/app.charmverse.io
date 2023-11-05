// eslint-disable-next-line import/no-extraneous-dependencies
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { useContext, createContext, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';

const Web3Connection = createContext({
  isWalletSelectorModalOpen: false,
  connectWallet: () => {},
  closeWalletSelectorModal: () => {},
  triedEager: false,
  isConnectingIdentity: false,
  setIsConnectingIdentity: (() => null) as Dispatch<SetStateAction<boolean>>
});

function Web3ConnectionManager({ children }: PropsWithChildren<any>) {
  const { isDisconnected, isConnected } = useAccount();
  const {
    isOpen: isWalletSelectorModalOpen,
    open: connectWallet,
    close: closeWalletSelectorModal
  } = usePopupState({ variant: 'popover', popupId: 'wallet-selector' });

  // Used for connecting to unstoppable domains
  const [isConnectingIdentity, setIsConnectingIdentity] = useState(false);

  // try to eagerly connect to an injected provider, if it exists and has granted access already
  // wagmi tries to reconnect automatically with result of state being either connected or disconnected
  const triedEager = isConnected || isDisconnected;

  const value = useMemo(
    () => ({
      isWalletSelectorModalOpen,
      connectWallet,
      closeWalletSelectorModal,
      triedEager,
      isConnectingIdentity,
      setIsConnectingIdentity
    }),
    [closeWalletSelectorModal, isConnectingIdentity, isWalletSelectorModalOpen, connectWallet, triedEager]
  );

  return <Web3Connection.Provider value={value}>{children}</Web3Connection.Provider>;
}

export const useWeb3ConnectionManager = () => useContext(Web3Connection);

export { Web3Connection, Web3ConnectionManager };
