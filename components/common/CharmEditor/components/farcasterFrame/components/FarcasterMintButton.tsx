import { log } from '@charmverse/core/log';
import { Tooltip, Typography } from '@mui/material';
import { switchNetwork } from '@wagmi/core';
import { getTokenFromUrl, type FrameButtonMint } from 'frames.js';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { GiDiamonds } from 'react-icons/gi';
import { useAccount, useNetwork } from 'wagmi';

import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import { FarcasterButton } from 'components/common/CharmEditor/components/farcasterFrame/components/FarcasterButton';
import { useReservoir } from 'hooks/useReservoir';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

type Props = {
  item: FrameButtonMint;
  isLoadingFrameAction: boolean;
  isFarcasterUserAvailable: boolean;
};

export function FarcasterMintButton({ item, isFarcasterUserAvailable, isLoadingFrameAction }: Props) {
  const { mintNFT } = useReservoir();
  const { user } = useUser();
  const { openSettings } = useSettingsDialog();
  const { isConnected } = useAccount();
  const { connectWallet } = useWeb3ConnectionManager();
  const { chain: currentChain } = useNetwork();
  const { showError, showMessage } = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);

  const tokenToMint = getTokenFromUrl(item.target);
  const canRender = item.action === 'mint' && item.target && tokenToMint;
  const hasWallet = !!user?.wallets?.length;

  if (!canRender) return null;

  const onClickMint = async () => {
    setIsLoading(true);
    try {
      // pass farcaster wallet address to mint
      const minted = await mintNFT(tokenToMint, '0x464fEcdb86cA7275c74bc65Fe95E72AA549Fa7ba');
      if (minted && (minted.txHash || minted.res === true)) {
        showMessage('NFT minted successfully!');
      }
    } catch (error) {
      log.warn('[frame] Failed to mint NFT', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const safeSwitchNetwork = async () => {
    try {
      setIsLoading(true);
      await switchNetwork({ chainId: tokenToMint.chainId });
    } catch (error) {
      log.warn('[frame] Failed to switch network', { error });
      showError('Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonConfig: () => { onClick: VoidFunction; label: string; tooltip?: string; icon?: ReactNode } = () => {
    if (!hasWallet) {
      return {
        tooltip: 'Add a wallet to your account before minting',
        onClick: () => openSettings('account'),
        label: 'Open settings'
      };
    }

    if (!isConnected) {
      return {
        onClick: connectWallet,
        label: 'Connect'
      };
    }

    if (currentChain?.id !== tokenToMint.chainId) {
      return {
        tooltip: 'Change connected network',
        onClick: safeSwitchNetwork,
        label: 'Change network'
      };
    }

    return {
      onClick: onClickMint,
      label: item.label,
      icon: <GiDiamonds style={{ marginRight: 4, fontSize: 14 }} />
    };
  };

  const button = getButtonConfig();

  return (
    <Tooltip title={button.tooltip}>
      <FarcasterButton
        onClick={button.onClick}
        loading={isLoading}
        disabled={isLoading || !isFarcasterUserAvailable || isLoadingFrameAction}
      >
        {button.icon}
        <Typography
          variant='body2'
          sx={{
            fontWeight: 500,
            textWrap: 'wrap'
          }}
        >
          {button.label}
        </Typography>
      </FarcasterButton>
    </Tooltip>
  );
}
