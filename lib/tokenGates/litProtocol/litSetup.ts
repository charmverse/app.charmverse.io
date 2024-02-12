import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import type { AuthCallback } from '@lit-protocol/types';
import { ethers, providers } from 'ethers';
import { SiweMessage } from 'siwe';

import { litNetwork, litOwnerWalletAddress, litWalletPrivateKey } from './config';
import { litNodeClient } from './litNodeClientNodeJs';

export function getSignerWallet(chainId: number = 175177) {
  const provider = new providers.JsonRpcProvider('https://chain-rpc.litprotocol.com/http', chainId);

  const signer = new ethers.Wallet(litWalletPrivateKey, provider);

  return {
    signer,
    provider
  };
}

const { signer: walletWithCapacityCredit, provider } = getSignerWallet();

/**
 * Use this only once to mint the nft
 * @returns string
 */
export async function mintNFT() {
  const contractClient = new LitContracts({
    signer: walletWithCapacityCredit,
    network: litNetwork,
    provider
  });

  await contractClient.connect();

  // this identifier will be used in delegation requests.
  const { capacityTokenIdStr } = await contractClient.mintCapacityCreditsNFT({
    requestsPerDay: 14400, // 10 request per minute
    daysUntilUTCMidnightExpiration: 2
  });

  return capacityTokenIdStr;
}

const authNeededCallback: AuthCallback = async ({ resources, expiration, uri }) => {
  // you can change this resource to anything you would like to specify
  const litResource = new LitActionResource('*');

  const recapObject = await litNodeClient.generateSessionCapabilityObjectWithWildcards([litResource]);

  recapObject.addCapabilityForResource(litResource, LitAbility.LitActionExecution);

  const verified = recapObject.verifyCapabilitiesForResource(litResource, LitAbility.LitActionExecution);

  if (!verified) {
    throw new Error('Failed to verify capabilities for resource');
  }

  let siweMessage = new SiweMessage({
    domain: 'localhost:3000',
    address: '0xbBb415A9Ea9F834c56110c843B77C2dc8cEcbc95',
    statement: 'You are about to sign the transaction',
    uri,
    version: '1',
    chainId: 1,
    expirationTime: expiration,
    resources
  });

  siweMessage = recapObject.addToSiweMessage(siweMessage);

  const messageToSign = siweMessage.prepareMessage();
  const signature = await walletWithCapacityCredit.signMessage(messageToSign);

  const authSig = {
    sig: signature.replace('0x', ''),
    derivedVia: 'web3.eth.personal.sign',
    signedMessage: messageToSign,
    address: litOwnerWalletAddress
  };

  return authSig;
};

export async function createSessionSigs() {
  // Wait for litNodeClient to be up
  if (!litNodeClient.ready) {
    await litNodeClient.connect();
  }
  // Get the capacity token id
  // const capacityTokenId = await mintNFT();

  const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
    uses: '1',
    dAppOwnerWallet: walletWithCapacityCredit,
    capacityTokenId: '102',
    delegateeAddresses: ['0xbBb415A9Ea9F834c56110c843B77C2dc8cEcbc95']
  });

  const sessionSigs = await litNodeClient.getSessionSigs({
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    chain: 'ethereum',
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LitAbility.LitActionExecution
      }
    ],
    authNeededCallback,
    capacityDelegationAuthSig
  });

  return sessionSigs;
}
