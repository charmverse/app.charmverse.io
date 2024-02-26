import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Box, Chip, MenuItem, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { isAddress } from 'viem';

import charmClient from 'charmClient';
import { useSetPrimaryWallet } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { NewIdentityModal } from 'components/settings/account/components/NewIdentityModal';
import { useIdentityTypes } from 'components/settings/account/hooks/useIdentityTypes';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { countConnectableIdentities } from 'lib/users/countConnectableIdentities';
import { shortWalletAddress } from 'lib/utilities/blockchain';
import randomName from 'lib/utilities/randomName';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { useUserDetails } from '../hooks/useUserDetails';

import Integration from './Integration';

export type IntegrationModel = {
  username: string;
  secondaryUserName?: string;
  type: IdentityType;
  isInUse: boolean;
  icon: ReactNode;
};

type IdentityModalProps = {
  close: () => void;
  isOpen: boolean;
};

function IdentityModal(props: IdentityModalProps) {
  const { close, isOpen } = props;
  const accountsPopupState = usePopupState({ variant: 'popover', popupId: 'accountsModal' });
  const { updateUser, user } = useUser();
  const identityTypes = useIdentityTypes({
    size: 'small'
  });
  const identityType = user?.identityType ?? 'Wallet';
  const [generatedName, setGeneratedName] = useState(
    user?.identityType === 'RandomName' && identityType === 'RandomName' ? user.username : randomName()
  );
  const { saveUser } = useUserDetails();
  const { account, requestSignature, verifiableWalletDetected, disconnectWallet } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const { disconnectVerifiedEmailAccount } = useFirebaseAuth();
  const { disconnectGoogleAccount } = useGoogleLogin();
  const deleteWalletPopupState = usePopupState({ variant: 'popover', popupId: 'deleteWalletModal' });
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;
  const [openAddress, setOpenAddress] = useState<string | null>(null);
  const { trigger: setPrimaryWallet } = useSetPrimaryWallet();
  const handleOpenDeleteModal = (address: string) => (event: MouseEvent<HTMLElement>) => {
    setOpenAddress(address);
    deleteWalletPopupState.open(event);
  };
  const primaryWallet = user?.wallets?.find((w) => w.id === user.primaryWalletId);

  const { trigger: signSuccess } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: AuthSig }>) => charmClient.addUserWallets([arg]),
    {
      onSuccess(data) {
        updateUser(data);
      }
    }
  );

  const onSetPrimaryWallet = async (walletId: string) => {
    try {
      await setPrimaryWallet({ walletId });
      updateUser({
        primaryWalletId: walletId
      });
      showMessage('Primary wallet set successfully', 'success');
    } catch (error) {
      log.error('Error setting primary wallet', error);
    }
  };

  const generateWalletAuth = async () => {
    try {
      const authSig = await requestSignature();
      await signSuccess(authSig);
    } catch (error) {
      log.error('Error requesting wallet signature in login page', error);
      showMessage('Wallet signature cancelled', 'info');
    }
  };

  const { trigger: disconnectFromTelegram } = useSWRMutation(
    telegramAccount ? '/telegram/disconnect' : null,
    () => charmClient.disconnectTelegram(),
    {
      onSuccess(data) {
        updateUser({ ...data, telegramUser: null });
      }
    }
  );

  const { connect } = useDiscordConnection();
  // Don't allow a user to remove their last identity
  const cannotDisconnect = !user || (user.wallets.length === 0 && countConnectableIdentities(user) <= 1);

  const [refreshingEns, setRefreshingEns] = useState(false);

  function refreshENSName(address: string) {
    setRefreshingEns(true);
    charmClient.blockchain
      .refreshENSName(address)
      .then((_user) => {
        updateUser(_user);
      })
      .finally(() => {
        setRefreshingEns(false);
      });
  }

  return (
    <>
      <Modal
        open={isOpen}
        onClose={() => {
          close();
          if (user?.identityType === 'RandomName') {
            setGeneratedName(user.username);
          }
        }}
        size='large'
        title='Select a public identity'
      >
        <Typography mb={2}>Select which integration you want to show as your username</Typography>
        <Box mb={2}>
          {identityTypes.map((item) => {
            const usernameToDisplay = item.type === 'RandomName' ? generatedName : item.username;
            const wallet = user?.wallets.find((w) => shortWalletAddress(w.address) === item.secondaryUserName);
            const verifiedEmail = user?.verifiedEmails.find((e) => e.email === item.username);
            return (
              <>
                <Integration
                  isInUse={item.type === 'RandomName' && generatedName !== item.username ? false : item.isInUse}
                  icon={item.icon}
                  identityType={item.type}
                  name={item.type === 'RandomName' ? 'Anonymous' : item.type}
                  username={shortWalletAddress(usernameToDisplay)}
                  secondaryUserName={item.secondaryUserName}
                  selectIntegration={() => saveUser({ username: usernameToDisplay, identityType: item.type })}
                  menuActions={
                    item.type === 'Wallet' && wallet
                      ? [
                          verifiableWalletDetected && !account ? (
                            <MenuItem key='verify' onClick={generateWalletAuth}>
                              Verify Wallet
                            </MenuItem>
                          ) : null,
                          <MenuItem
                            disabled={lowerCaseEqual(wallet.address, primaryWallet?.address)}
                            key='set-primary'
                            onClick={() => {
                              onSetPrimaryWallet(wallet.id);
                            }}
                          >
                            Set as Primary
                          </MenuItem>,
                          <MenuItem
                            disabled={cannotDisconnect || lowerCaseEqual(wallet.address, account)}
                            key='disconnect'
                            onClick={handleOpenDeleteModal(wallet.address)}
                          >
                            Disconnect Wallet
                          </MenuItem>
                        ]
                      : item.type === 'Discord'
                      ? [
                          <MenuItem disabled={cannotDisconnect} key='disconnect' onClick={connect}>
                            Disconnect
                          </MenuItem>
                        ]
                      : item.type === 'Telegram'
                      ? [
                          <MenuItem
                            disabled={cannotDisconnect}
                            key='disconnect'
                            onClick={() => disconnectFromTelegram()}
                          >
                            Disconnect
                          </MenuItem>
                        ]
                      : item.type === 'Google'
                      ? [
                          <MenuItem key='disconnect' disabled={cannotDisconnect} onClick={disconnectGoogleAccount}>
                            Disconnect
                          </MenuItem>
                        ]
                      : item.type === 'VerifiedEmail' && verifiedEmail
                      ? [
                          <MenuItem
                            key='disconnect'
                            disabled={cannotDisconnect}
                            onClick={() => disconnectVerifiedEmailAccount(verifiedEmail.email)}
                          >
                            Disconnect
                          </MenuItem>
                        ]
                      : []
                  }
                  action={
                    item.type === 'RandomName' ? (
                      <Tooltip key='RandomName' arrow placement='top' title='Generate a new name'>
                        <IconButton onClick={() => setGeneratedName(randomName())}>
                          <RefreshIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    ) : item.type === 'Wallet' ? (
                      <>
                        {wallet && primaryWallet && lowerCaseEqual(wallet.address, primaryWallet.address) && (
                          <Chip size='small' sx={{ ml: 1 }} label='Primary' variant='outlined' />
                        )}
                        {isAddress(usernameToDisplay) && (
                          <Tooltip
                            key='wallet-address'
                            onMouseEnter={(e) => e.stopPropagation()}
                            arrow
                            placement='top'
                            title={refreshingEns ? 'Looking up ENS Name' : 'Refresh ENS name'}
                          >
                            {refreshingEns ? (
                              <IconButton>
                                <LoadingComponent size={20} isLoading />
                              </IconButton>
                            ) : (
                              <IconButton onClick={() => refreshENSName(item.username)}>
                                <RefreshIcon fontSize='small' />
                              </IconButton>
                            )}
                          </Tooltip>
                        )}
                      </>
                    ) : null
                  }
                  key={item.type}
                />
                {wallet && (
                  <ConfirmDeleteModal
                    title='Disconnect wallet'
                    question={
                      <Box>
                        {lowerCaseEqual(wallet.address, account) ? (
                          <Typography>
                            You can't disconnect your current active wallet. You need to switch to another wallet first.
                          </Typography>
                        ) : (
                          <>
                            <Typography mb={1}>
                              Are you sure you want to Disconnect your {wallet.ensname || wallet.address} wallet?
                            </Typography>
                            <Typography variant='body2'>
                              This action will remove your wallet, NFTs, POAPs, Organizations from CharmVerse. It will
                              also remove roles and permissions if you joined the Space via a token gate.
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                    buttonText='Disconnect'
                    onConfirm={() => disconnectWallet(wallet.address)}
                    onClose={deleteWalletPopupState.close}
                    open={deleteWalletPopupState.isOpen && openAddress === wallet.address}
                    disabled={lowerCaseEqual(wallet.address, account)}
                  />
                )}
              </>
            );
          })}
        </Box>
        <Button color='primary' endIcon={<NavigateNextIcon />} {...bindTrigger(accountsPopupState)}>
          + Add an account
        </Button>
      </Modal>

      <NewIdentityModal isOpen={accountsPopupState.isOpen} onClose={accountsPopupState.close} />
    </>
  );
}

export default IdentityModal;
