import { BigNumber } from '@ethersproject/bignumber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Divider, Menu, MenuItem } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { UserGnosisSafe } from '@prisma/client';
import ERC20ABI from 'abis/ERC20ABI.json';
import { getChainById } from 'connectors';
import type { Signer } from 'ethers';
import { ethers } from 'ethers';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { getPaymentErrorMessage, useGnosisPayment } from 'hooks/useGnosisPayment';
import { useMultiBountyPayment } from 'hooks/useMultiBountyPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import useGnosisSigner from 'hooks/useWeb3Signer';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import type { BountyWithDetails } from 'lib/bounties';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import { isValidChainAddress } from 'lib/tokens/validation';
import { shortenHex } from 'lib/utilities/strings';

interface Props {
  receiver: string;
  amount: string;
  tokenSymbolOrAddress: string;
  chainIdToUse: number;
  onSuccess?: (txId: string, chainId: number) => void;
  onClick?: () => void;
  onError?: (err: string, severity?: AlertColor) => void;
  bounty: BountyWithDetails;
}

function SafeMenuItem({
  label,
  safeInfo,
  bounty,
  onClick,
  onError = () => {}
}: {
  safeInfo: SafeData;
  label: string;
  bounty: BountyWithDetails;
  onClick: () => void;
  onError: (err: string, severity?: AlertColor) => void;
}) {
  const { onPaymentSuccess, transactions } = useMultiBountyPayment({ bounties: [bounty] });
  const { makePayment } = useGnosisPayment({
    chainId: safeInfo.chainId,
    onSuccess: onPaymentSuccess,
    safeAddress: safeInfo.address,
    transactions: transactions.map((getTransaction) => getTransaction(safeInfo.address))
  });

  return (
    <MenuItem
      dense
      onClick={async () => {
        onClick();
        try {
          await makePayment();
        } catch (error: any) {
          onError(getPaymentErrorMessage(error));
        }
      }}
    >
      {label}
    </MenuItem>
  );
}

export default function BountyPaymentButton({
  receiver,
  bounty,
  amount,
  chainIdToUse,
  tokenSymbolOrAddress,
  onSuccess = (tx: string, chainId: number) => {},
  onClick = () => null,
  onError = () => {}
}: Props) {
  const { data: safesData } = useMultiWalletSigs();
  const signer = useGnosisSigner();
  const { account, library, chainId } = useWeb3AuthSig();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { data: safeInfos } = useSWR(
    signer && account ? `/connected-gnosis-safes/${account}/${chainIdToUse}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainIdToUse, address: account! })
  );

  const safeDataRecord =
    safesData?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
      if (!record[userGnosisSafe.address]) {
        record[userGnosisSafe.address] = userGnosisSafe;
      }
      return record;
    }, {}) ?? {};

  const [paymentMethods] = usePaymentMethods();

  const makePayment = async () => {
    if (!chainIdToUse) {
      onError('Please set up a chain for this payment.');
      return;
    }

    const chainToUse = getChainById(chainIdToUse);

    if (!chainToUse) {
      onError('Chain assigned to this payment is not supported.');
      return;
    }

    const currentUserChain = chainId ? getChainById(chainId) : undefined;

    if (!currentUserChain) {
      onError(
        'Could not detect your chain. Please make sure you are connected to a supported network and your wallet is unlocked.'
      );
      return;
    }

    try {
      if (chainToUse.chainId !== currentUserChain.chainId) {
        await switchActiveNetwork(chainToUse.chainId);
      }

      const web3signer = library.getSigner(account) as Signer;

      if (chainToUse.nativeCurrency.symbol === tokenSymbolOrAddress) {
        const tx = await web3signer.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount)
        });

        onSuccess(tx.hash, chainToUse.chainId);
      } else if (isValidChainAddress(tokenSymbolOrAddress)) {
        const tokenContract = new ethers.Contract(tokenSymbolOrAddress, ERC20ABI, web3signer);

        const paymentMethod = paymentMethods.find(
          (method) => method.contractAddress === tokenSymbolOrAddress || method.id === tokenSymbolOrAddress
        );
        let tokenDecimals = paymentMethod?.tokenDecimals;

        if (typeof tokenDecimals !== 'number') {
          try {
            const tokenInfo = await charmClient.getTokenMetaData({
              chainId: chainToUse!.chainId as SupportedChainId,
              contractAddress: tokenSymbolOrAddress
            });
            tokenDecimals = tokenInfo.decimals;
          } catch (error) {
            onError(
              `Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on ${chainToUse.chainName}`
            );
            return;
          }
        }

        const parsedTokenAmount = ethers.utils.parseUnits(amount, tokenDecimals);

        // get allowance
        const allowance = await tokenContract.allowance(account, receiver);

        if (BigNumber.from(allowance).lt(parsedTokenAmount)) {
          // approve if the allowance is small
          await tokenContract.approve(receiver, parsedTokenAmount);
        }

        // transfer token
        const tx = await tokenContract.transfer(receiver, parsedTokenAmount);
        onSuccess(tx.hash, chainToUse!.chainId);
      } else {
        onError('Please provide a valid contract address');
      }
    } catch (err: any) {
      onError(getPaymentErrorMessage(err));
    }
  };

  const hasSafes = Boolean(safeInfos?.length);

  return (
    <>
      <Button
        color='primary'
        endIcon={hasSafes ? <KeyboardArrowDownIcon /> : null}
        size='small'
        onClick={(e) => {
          if (!hasSafes) {
            onClick();
            makePayment();
          } else {
            handleClick(e);
          }
        }}
      >
        Send Payment
      </Button>
      {hasSafes && (
        <Menu id='bounty-payment' anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>
            Connected wallet
          </MenuItem>
          <MenuItem
            dense
            onClick={() => {
              onClick();
              makePayment();
              handleClose();
            }}
          >
            {shortenHex(account ?? '')}
          </MenuItem>
          <Divider />
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>
            Gnosis wallets
          </MenuItem>
          {safeInfos?.map((safeInfo) => (
            <SafeMenuItem
              key={safeInfo.address}
              bounty={bounty}
              label={safeDataRecord[safeInfo.address]?.name ?? shortenHex(safeInfo.address)}
              onClick={() => {
                onClick();
                handleClose();
              }}
              onError={onError}
              safeInfo={safeInfo}
            />
          ))}
        </Menu>
      )}
    </>
  );
}
