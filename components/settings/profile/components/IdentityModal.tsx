import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Box, Chip, MenuItem, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { isAddress } from 'viem';

import charmClient from 'charmClient';
import { useRefreshENSName } from 'charmClient/hooks/blockchain';
import { useFarcasterDisconnect } from 'charmClient/hooks/farcaster';
import { useAddUserWallets, useSetPrimaryWallet } from 'charmClient/hooks/profile';
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
import type { TelegramAccount } from 'lib/telegram/interfaces';
import { countConnectableIdentities } from 'lib/users/countConnectableIdentities';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { randomName } from 'lib/utils/randomName';
import { lowerCaseEqual } from 'lib/utils/strings';

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
  return (
    <Modal open={isOpen} onClose={close} size='large' title='Select your identity'>
      <UserIdentities />
    </Modal>
  );
}

export function UserIdentities() {
  const accountsPopupState = usePopupState({ variant: 'popover', popupId: 'accountsModal' });
  const { updateUser, refreshUser, user } = useUser();
  const identityTypes = useIdentityTypes({
    size: 18
  });
  const identityType = user?.identityType ?? 'Wallet';
  const [generatedName, setGeneratedName] = useState(
    user?.identityType === 'RandomName' && identityType === 'RandomName' ? user.username : randomName()
  );
  const { saveUser } = useUserDetails();
  const { account, requestSignature, verifiableWalletDetected, disconnectWallet } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const { disconnectVerifiedEmailAccount } = useFirebaseAuth();
  const { trigger: disconnectFarcaster } = useFarcasterDisconnect();
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

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useAddUserWallets();

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
      const payload = await requestSignature();
      await signSuccess(payload, {
        onSuccess(data) {
          updateUser(data);
        }
      });
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

  const { disconnect } = useDiscordConnection();
  const { trigger: triggerRefreshENSName, isMutating: isRefreshingEns } = useRefreshENSName();
  // Don't allow a user to remove their last identity
  const cannotDisconnect = !user || (user.wallets.length === 0 && countConnectableIdentities(user) <= 1);

  async function refreshENSName(address: string) {
    await triggerRefreshENSName({ address }, { onSuccess: updateUser });
  }

  return (
    <>
      <Box mb={1}>
        {identityTypes.map((item) => {
          const usernameToDisplay = item.type === 'RandomName' ? generatedName : item.username;
          const wallet = user?.wallets.find((w) => shortWalletAddress(w.address) === item.secondaryUserName);
          const verifiedEmail = user?.verifiedEmails.find((e) => e.email === item.username);
          const isPrimaryWallet =
            wallet && primaryWallet ? lowerCaseEqual(wallet.address, primaryWallet.address) : false;
          const isIdentityInUse = item.type === 'RandomName' && generatedName !== item.username ? false : item.isInUse;
          const isIdentityDisconnectDisabled = isIdentityInUse || cannotDisconnect;
          const identityDisconnectMenuItemTooltip = cannotDisconnect
            ? `You can't disconnect your last connected account`
            : isIdentityInUse
              ? `You can't disconnect your current active identity`
              : '';

          return (
            <>
              <Integration
                isInUse={isIdentityInUse}
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
                          <MenuItem key='verify' onClick={generateWalletAuth} disabled={isVerifyingWallet}>
                            Verify Wallet
                          </MenuItem>
                        ) : null,
                        <Tooltip
                          key='set-primary'
                          title={
                            user?.wallets?.length === 1
                              ? `
                              You need to have more than one wallet to set a primary wallet
                            `
                              : isPrimaryWallet
                                ? 'Wallet already selected as primary wallet'
                                : ''
                          }
                        >
                          <div>
                            <MenuItem
                              disabled={isPrimaryWallet || user?.wallets?.length === 1}
                              onClick={() => {
                                onSetPrimaryWallet(wallet.id);
                              }}
                            >
                              Set as Primary
                            </MenuItem>
                          </div>
                        </Tooltip>,
                        <Tooltip
                          key='disconnect'
                          title={
                            lowerCaseEqual(wallet.address, account)
                              ? "You can't disconnect your current active wallet."
                              : cannotDisconnect
                                ? `You can't disconnect your last wallet`
                                : ''
                          }
                        >
                          <div>
                            <MenuItem
                              disabled={cannotDisconnect || lowerCaseEqual(wallet.address, account)}
                              onClick={handleOpenDeleteModal(wallet.address)}
                            >
                              Disconnect Wallet
                            </MenuItem>
                          </div>
                        </Tooltip>
                      ]
                    : item.type === 'Discord'
                      ? [
                          <Tooltip title={identityDisconnectMenuItemTooltip} key='disconnect'>
                            <div>
                              <MenuItem disabled={isIdentityDisconnectDisabled} key='disconnect' onClick={disconnect}>
                                Disconnect
                              </MenuItem>
                            </div>
                          </Tooltip>
                        ]
                      : item.type === 'Telegram'
                        ? [
                            <Tooltip title={identityDisconnectMenuItemTooltip} key='disconnect'>
                              <div>
                                <MenuItem
                                  disabled={isIdentityDisconnectDisabled}
                                  key='disconnect'
                                  onClick={() => disconnectFromTelegram()}
                                >
                                  Disconnect
                                </MenuItem>
                              </div>
                            </Tooltip>
                          ]
                        : item.type === 'Google'
                          ? [
                              <Tooltip title={identityDisconnectMenuItemTooltip} key='disconnect'>
                                <div>
                                  <MenuItem
                                    disabled={isIdentityDisconnectDisabled}
                                    key='disconnect'
                                    onClick={disconnectGoogleAccount}
                                  >
                                    Disconnect
                                  </MenuItem>
                                </div>
                              </Tooltip>
                            ]
                          : item.type === 'VerifiedEmail' && verifiedEmail
                            ? [
                                <Tooltip title={identityDisconnectMenuItemTooltip} key='disconnect'>
                                  <div>
                                    <MenuItem
                                      disabled={isIdentityDisconnectDisabled}
                                      key='disconnect'
                                      onClick={() => disconnectVerifiedEmailAccount(verifiedEmail.email)}
                                    >
                                      Disconnect
                                    </MenuItem>
                                  </div>
                                </Tooltip>
                              ]
                            : item.type === 'Farcaster'
                              ? [
                                  <Tooltip title={identityDisconnectMenuItemTooltip} key='disconnect'>
                                    <div>
                                      <MenuItem
                                        disabled={isIdentityDisconnectDisabled}
                                        key='disconnect'
                                        onClick={() =>
                                          disconnectFarcaster(undefined, {
                                            onSuccess: () => refreshUser()
                                          })
                                        }
                                      >
                                        Disconnect
                                      </MenuItem>
                                    </div>
                                  </Tooltip>
                                ]
                              : []
                }
                action={
                  item.type === 'RandomName' ? (
                    <Tooltip key='RandomName' arrow placement='top' title='Generate a new name'>
                      <IconButton
                        size='small'
                        sx={{
                          p: 0.5
                        }}
                        onClick={() => setGeneratedName(randomName())}
                      >
                        <RefreshIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  ) : item.type === 'Wallet' ? (
                    <>
                      {wallet && primaryWallet && lowerCaseEqual(wallet.address, primaryWallet.address) && (
                        <Chip size='small' sx={{ ml: 1 }} label='Primary Wallet' variant='outlined' />
                      )}
                      {wallet?.address && isAddress(wallet.address) && (
                        <Tooltip
                          key='wallet-address'
                          onMouseEnter={(e) => e.stopPropagation()}
                          arrow
                          placement='right'
                          title={isRefreshingEns ? 'Looking up ENS Name' : 'Refresh ENS name'}
                        >
                          {isRefreshingEns ? (
                            <IconButton>
                              <LoadingComponent size={20} isLoading />
                            </IconButton>
                          ) : (
                            <IconButton onClick={() => refreshENSName(wallet.address)}>
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
      <Button color='primary' {...bindTrigger(accountsPopupState)}>
        + Add an account
      </Button>
      <NewIdentityModal isOpen={accountsPopupState.isOpen} onClose={accountsPopupState.close} />
    </>
  );
}

export default IdentityModal;
