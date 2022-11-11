import { BigNumber } from '@ethersproject/bignumber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Divider, Menu, MenuItem } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { UserGnosisSafe } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import ERC20ABI from 'abis/ERC20ABI.json';
import { getChainById } from 'connectors';
import type { Signer } from 'ethers';
import { ethers } from 'ethers';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGnosisPayment } from 'hooks/useGnosisPayment';
import { useMultiBountyPayment } from 'hooks/useMultiBountyPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
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

function extractWalletErrorMessage (error: any): string {
  if ((error)?.code === 'INSUFFICIENT_FUNDS') {
    return 'You do not have sufficient funds to perform this transaction';
  }
  else if ((error)?.code === 4001) {
    return 'You rejected the transaction';
  }
  else if ((error)?.code === -32602) {
    return 'A valid recipient must be provided';
  }
  else if ((error)?.reason) {
    return error.reason;
  }
  else if ((error)?.message) {
    return error.message;
  }
  else if (typeof error === 'object') {
    return JSON.stringify(error);
  }
  else if (typeof error === 'string') {
    return error;
  }
  else {
    return 'An unknown error occurred';
  }
}

function SafeMenuItem ({
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
    transactions: transactions.map(getTransaction => getTransaction(safeInfo.address))
  });

  return (
    <MenuItem
      dense
      onClick={async () => {
        onClick();
        try {
          await makePayment();
        }
        catch (error: any) {
          const errorMessage = extractWalletErrorMessage(error);

          if (errorMessage === 'underlying network changed') {
            onError("You've changed your active network.\r\nRe-select 'Make payment' to complete this transaction", 'warning');
          }
          else {
            onError(errorMessage);
          }
        }
      }}
    >{label}
    </MenuItem>
  );
}

export default function BountyPaymentButton ({
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
  const { account, library, chainId } = useWeb3React();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { data: safeInfos } = useSWR(
    (signer && account) ? `/connected-gnosis-safes/${account}/${chainIdToUse}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainIdToUse, address: account! })
  );

  const safeDataRecord = safesData?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
    if (!record[userGnosisSafe.address]) {
      record[userGnosisSafe.address] = userGnosisSafe;
    }
    return record;
  }, {}) ?? {};

  const [paymentMethods] = usePaymentMethods();

  const makePayment = async () => {

    if (!chainIdToUse) {
      onError('Please provide a chainId');
      return;
    }

    const chainToUse = getChainById(chainIdToUse);

    if (!chainToUse) {
      onError('This chain is not supported');
      return;
    }

    const currentUserChain = chainId ? getChainById(chainId) : undefined;

    if (!currentUserChain) {
      onError('Could not detect your chain');
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
      }
      else if (isValidChainAddress(tokenSymbolOrAddress)) {
        const tokenContract = new ethers.Contract(tokenSymbolOrAddress, ERC20ABI, web3signer);

        const paymentMethod = paymentMethods.find(method => (
          method.contractAddress === tokenSymbolOrAddress || method.id === tokenSymbolOrAddress
        ));
        let tokenDecimals = paymentMethod?.tokenDecimals;

        if (typeof tokenDecimals !== 'number') {
          try {
            const tokenInfo = await charmClient.getTokenMetaData({
              chainId: chainToUse!.chainId as SupportedChainId,
              contractAddress: tokenSymbolOrAddress
            });
            tokenDecimals = tokenInfo.decimals;
          }
          catch (error) {
            onError(`Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on ${chainToUse.chainName}`);
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
      }
      else {
        onError('Please provide a valid contract address');
      }
    }
    catch (err: any) {
      const errorMessage = extractWalletErrorMessage(err);

      if (errorMessage === 'underlying network changed') {
        onError("You've changed your active network.\r\nRe-select 'Make payment' to complete this transaction", 'warning');
      }
      else {
        onError(errorMessage);
      }
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
          }
          else {
            handleClick(e);
          }
        }}
      >
        Send Payment
      </Button>
      {hasSafes && (
        <Menu
          id='bounty-payment'
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>Connected wallet</MenuItem>
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
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>Gnosis wallets</MenuItem>
          {
          safeInfos?.map(safeInfo => (
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
          ))
        }
        </Menu>
      )}
    </>
  );
}
