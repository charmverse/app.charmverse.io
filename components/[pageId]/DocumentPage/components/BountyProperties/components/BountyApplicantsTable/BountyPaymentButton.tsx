import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import type { AlertColor } from '@mui/material/Alert';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import charmClient from 'charmClient';
import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { getChainById } from 'connectors';
import { isValidChainAddress } from 'lib/tokens/validation';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy';
import { Divider, Menu, MenuItem } from '@mui/material';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import type { UserGnosisSafe } from '@prisma/client';
import useGnosisSigner from 'hooks/useWeb3Signer';
import useSWR from 'swr';
import { getSafesForAddress } from 'lib/gnosis';
import { shortenHex } from 'lib/utilities/strings';
import FieldLabel from 'components/common/form/FieldLabel';
import ERC20ABI from '../../../../../../../abis/ERC20ABI.json';

interface Props {
  receiver: string;
  amount: string;
  tokenSymbolOrAddress: string;
  chainIdToUse: number;
  onSuccess?: (txId: string, chainId: number) => void;
  onClick?: () => void;
  onError?: (err: string, severity?: AlertColor) => void;
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

/**
 * See
 * https://stackoverflow.com/a/68267546
 * @param chainId
 * @returns
 */
async function switchActiveNetwork (chainId: number) {
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ethers.utils.hexValue(chainId) }]
    });
    return;
  }
  catch (error: any) {
    if (error.code === 4902) {

      const chainInfo = getChainById(chainId);

      if (!chainInfo) {
        throw new Error('Unsupported chain');
      }

      return (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            ...chainInfo,
            chainId: ethers.utils.hexValue(chainInfo?.chainId)
          }

        ]
      });

    }
    else {
      throw error;
    }
  }
}

export default function BountyPaymentButton ({
  receiver,
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
    (signer && account && chainId) ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  const safeDataRecord = useMemo(() => {
    return safesData?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
      if (!record[userGnosisSafe.address]) {
        record[userGnosisSafe.address] = userGnosisSafe;
      }
      return record;
    }, {}) ?? {};
  }, [safesData]);

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

      const web3signer = library.getSigner(account);

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

  return (
    <>
      <Button
        color='primary'
        size='small'
        onClick={handleClick}
      >
        Send Payment
      </Button>
      <Menu
        id='bounty-payment'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => {
          onClick();
          makePayment();
          handleClose();
        }}
        >Metamask Wallet
        </MenuItem>
        {
          safeInfos && (
            <Divider />
          )
        }
        {
          safeInfos?.map(safeInfo => (
            <MenuItem onClick={() => {
              // onClick();
              // makePayment();
              handleClose();
            }}
            >{safeDataRecord[safeInfo.address]?.name ?? shortenHex(safeInfo.address)}
            </MenuItem>
          ))
        }
      </Menu>
    </>
  );
}
