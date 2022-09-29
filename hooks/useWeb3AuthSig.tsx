import { verifyMessage } from '@ethersproject/wallet';
import { useWeb3React } from '@web3-react/core';
import { getAddress, toUtf8Bytes } from 'ethers/lib/utils';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { box } from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { ExternalServiceError } from '../lib/utilities/errors';
import { PREFIX, useLocalStorage } from './useLocalStorage';

type IContext = {
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
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

  const [litCommKey, setLitCommKey] = useLocalStorage<{ publicKey: string, secretKey: string } | null>('lit-comms-keypair', null, true);

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);

  // External
  // Inform the user that we have an account but not auth signature

  useEffect(() => {
    //  Automagic lit signature update only

    if (account) {
      const storedWalletSignature = window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${account}`);

      if (storedWalletSignature) {
        setLitAuthSignature(JSON.parse(storedWalletSignature));
        setWalletAuthSignature(JSON.parse(storedWalletSignature));
      }
    }
    else {
      setWalletAuthSignature(null);
    }
  }, [account]);

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
      derivedVia: 'charmverse.sign',
      signedMessage: body,
      address: signatureAddress
    };

    window.localStorage.setItem(`${PREFIX}.wallet-auth-sig-${account}`, JSON.stringify(generated));
    setWalletAuthSignature(generated);

    if (!litCommKey) {
      const commsKeyPair = box.keyPair();
      setLitCommKey({
        publicKey: naclUtil.encodeBase64(commsKeyPair.publicKey),
        secretKey: naclUtil.encodeBase64(commsKeyPair.secretKey)
      });
    }

    return generated;
  }

  const value = useMemo(() => ({ account, walletAuthSignature, sign }) as IContext, [account, walletAuthSignature]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );

}

export const useWeb3AuthSig = () => useContext(Web3Context);
