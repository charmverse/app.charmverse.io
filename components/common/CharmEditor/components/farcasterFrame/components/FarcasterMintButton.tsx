import { log } from '@charmverse/core/log';
import { Tooltip, Typography } from '@mui/material';
import { wagmiConfig } from '@packages/connectors/config';
import { switchChain } from '@wagmi/core';
import { type FrameButtonMint } from 'frames.js';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { GiDiamonds } from 'react-icons/gi';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import { FarcasterButton } from 'components/common/CharmEditor/components/farcasterFrame/components/FarcasterButton';
import { useReservoir } from 'hooks/useReservoir';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useAccount } from 'hooks/wagmi';

type Props = {
  item: FrameButtonMint;
  isLoadingFrameAction: boolean;
  isFarcasterUserAvailable: boolean;
  takerAddress: string;
  frameUrl: string;
  pageId?: string;
  spaceId?: string;
};

// Reference: https://github.com/framesjs/frames.js/blob/55c53e77776cefec391265eef2c8ea47428f0495/packages/frames.js/src/getTokenFromUrl.ts#L9
/** Parses a [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) compliant URL with optional token ID */
function getTokenFromUrl(url: string) {
  const [namespace, chainId, address, tokenId] = url.split(':');
  if (!namespace || !chainId || !address) {
    throw new Error('Invalid token URL');
  }
  return {
    namespace,
    chainId: parseInt(chainId),
    address,
    tokenId
  };
}

export function FarcasterMintButton({
  item,
  isFarcasterUserAvailable,
  isLoadingFrameAction,
  takerAddress,
  spaceId,
  frameUrl,
  pageId
}: Props) {
  const { mintNFT } = useReservoir();
  const { user } = useUser();
  const { openSettings } = useSettingsDialog();
  const { isConnected, chain: currentChain } = useAccount();
  const { connectWallet } = useWeb3ConnectionManager();
  const { showError, showMessage } = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);

  const tokenToMint = getTokenFromUrl(item.target);
  const canRender = item.action === 'mint' && item.target && tokenToMint;
  const hasWallet = !!user?.wallets?.length;

  if (!canRender) return null;

  const onClickMint = async () => {
    setIsLoading(true);
    try {
      if (frameUrl && pageId && spaceId) {
        charmClient.track.trackAction('frame_mint_start', {
          frameUrl,
          pageId,
          spaceId
        });
      }

      const minted = await mintNFT(tokenToMint, takerAddress);
      if (minted && (minted.txHash || minted.res === true)) {
        if (frameUrl && pageId && spaceId) {
          charmClient.track.trackAction('frame_mint_success', {
            frameUrl,
            pageId,
            spaceId
          });
        }
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
      await switchChain(wagmiConfig, { chainId: tokenToMint.chainId });
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
        disabled={isLoading || !isFarcasterUserAvailable || isLoadingFrameAction || !takerAddress}
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
