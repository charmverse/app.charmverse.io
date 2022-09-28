import { verifyMessage } from '@ethersproject/wallet';
import { user } from '@guildxyz/sdk';
import { useWeb3React } from '@web3-react/core';
import type { ethers } from 'ethers';
import { toUtf8Bytes, hexlify, getAddress } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { box } from 'tweetnacl';
import type { AuthSig } from 'lib/blockchain/interfaces';
import naclUtil from 'tweetnacl-util';
import { useLocalStorage } from './useLocalStorage';
import useWeb3Signer from './useWeb3Signer';
import { useSnackbar } from './useSnackbar';
import { InvalidStateError } from '../lib/middleware';
import { ExternalServiceError } from '../lib/utilities/errors';

type IContext = {
  account?: string | null;
  walletAuthSignature?: string | null;
  sign: () => Promise<AuthSig | null>;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  sign: () => Promise.resolve(null)
});

// a wrapper around account and library from web3react
export function Web3AccountProvider ({ children }: { children: ReactNode }) {

  const { account, library } = useWeb3React();

  const [_, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [walletProvider, setWalletProvider] = useLocalStorage<string>('lit-web3-provider', 'coinbase', true);

  const [litCommKey, setLitCommKey] = useLocalStorage<{ publicKey: string, secretKey: string } | null>('lit-comms-keypair', null, true);
  const [walletAuthSignature, setWalletAuthSignature] = useState(useLocalStorage<AuthSig | null>(`wallet-auth-sig-${account}`, null)[0]);

  // External
  // Inform the user that we have an account but not auth signature

  useEffect(() => {
    //  Automagic lit signature update only

    if (account) {
      setLitAuthSignature(walletAuthSignature);
    }
  }, [account, walletAuthSignature]);

  async function sign (): Promise<AuthSig> {

    const signer = library.getSigner(account);

    if (!signer) {
      throw new ExternalServiceError('Missing signer');
    }

    const chainId = await signer?.getChainId();

    const preparedMessage = {
      domain: window.location.host,
      address: getAddress(account as string), // convert to EIP-55 format or else SIWE complains
      uri: globalThis.location.origin,
      version: '1',
      chainId
    };

    const message = new SiweMessage(preparedMessage);

    const body = message.prepareMessage();

    const messageBytes = toUtf8Bytes(body);

    const newSignature = await signer.signMessage(messageBytes);

    // .('personal_sign', [
    //   hexlify(messageBytes),
    //   account?.toLowerCase()
    // ]);

    const signatureAddress = verifyMessage(body, newSignature as string).toLowerCase();

    if (signatureAddress !== account?.toLowerCase()) {
      throw new Error('Signature address does not match account');
    }

    const generated: AuthSig = {
      sig: newSignature,
      derivedVia: 'web3.eth.personal.sign',
      signedMessage: body,
      address: signatureAddress
    };

    setWalletAuthSignature(generated);

    if (!litCommKey) {
      const commsKeyPair = box.keyPair();
      setLitCommKey({
        publicKey: naclUtil.encodeBase64(commsKeyPair.publicKey),
        secretKey: naclUtil.encodeBase64(commsKeyPair.secretKey)
      });
    }

    return generated;

    // const commsKeyPair = box.keyPair();
  }

  const value = useMemo(() => ({ account, walletAuthSignature, sign }) as IContext, [account, walletAuthSignature]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );

}

export const useWeb3AuthSig = () => useContext(Web3Context);
