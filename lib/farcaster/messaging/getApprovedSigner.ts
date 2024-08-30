/* eslint-disable camelcase */

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Signer } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster';
import { GET, POST } from '@root/adapters/http';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { sleep } from '@root/lib/utils/sleep';
import { encodeAbiParameters } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

import {
  NEYNAR_API_BASE_URL,
  NEYNAR_SIGNER_ID,
  NEYNAR_SIGNER_PUBLIC_KEY,
  WARPCAST_NOTIFICATION_ACCOUNT_SEED
} from '../constants';
import { lookupUserByCustodyAddress } from '../lookupUserByCustodyAddress';

import { keyGatewayAbi } from './abi/keyGatewayAbi';
import { SignedKeyRequestMetadataABI } from './abi/signedKeyRequestMetadataAbi';

// A constant message for greeting or logging.
export const MESSAGE = `gm 🪐`;

// Source code for these methods
// https://github.com/neynarxyz/farcaster-examples/blob/main/gm-bot/src/utils.ts

const viemPublicClient = getPublicClient(optimism.id);

async function lookupSigner(signerId: string): Promise<Signer> {
  const url = `${NEYNAR_API_BASE_URL}/signer`;

  const signer = await GET<Signer>(
    url,
    {
      signer_uuid: signerId
    },
    {
      headers: {
        accept: 'application/json',
        api_key: 'NEYNAR_API_DOCS'
      }
    }
  );

  return signer;
}

async function generateSigner(): Promise<Signer> {
  const url = `${NEYNAR_API_BASE_URL}/signer`;

  const signer = await POST<Signer>(url, undefined, {
    headers: {
      accept: 'application/json',
      api_key: 'NEYNAR_API_DOCS'
    }
  });

  return signer;
}

// Copied from Neynar as using the sdk throws a runtime error
const SignerStatusEnum = {
  Generated: 'generated',
  PendingApproval: 'pending_approval',
  Approved: 'approved',
  Revoked: 'revoked'
} as const;

/**
 * Generates an approved signer for the user.
 *
 * copied from https://github.com/neynarxyz/farcaster-examples/blob/main/gm-bot/src/utils.ts#L50-L204
 */
export const getApprovedSignerId = async () => {
  let signerPublicKey: string = NEYNAR_SIGNER_PUBLIC_KEY;
  let signerId = NEYNAR_SIGNER_ID;

  try {
    if (NEYNAR_SIGNER_ID) {
      const signer = await lookupSigner(NEYNAR_SIGNER_ID).catch((error) => {
        log.error(`Error fetching signer ${NEYNAR_SIGNER_ID} from Neynar`, { error });
      });

      if (signer?.status === SignerStatusEnum.Approved) {
        log.info('✅ Approved signer', NEYNAR_SIGNER_ID);
        return NEYNAR_SIGNER_ID;
      } else if (signer && !signerPublicKey) {
        signerPublicKey = signer.public_key as string;
      } else if (signer && signerPublicKey !== signer.public_key) {
        throw new InvalidInputError(
          `Public key mismatch for signer ${signer.signer_uuid}. Received key ${signer.public_key}, but environment declared ${NEYNAR_SIGNER_PUBLIC_KEY}`
        );
      }
    }

    // Creating a new signer and obtaining its public key and UUID.
    // eslint-disable-next-line camelcase

    if (!signerPublicKey || !signerId) {
      log.info('Generating signer...');
      const generatedSigner = await generateSigner();
      signerPublicKey = generatedSigner.public_key;
      signerId = generatedSigner.signer_uuid;
      log.info(`✅ Generated signer ID:"${signerId} Public Key: "${signerPublicKey}`);
    }

    // Constants for the EIP-712 domain and request type, required for signing data.
    // DO NOT CHANGE ANY VALUES IN THESE CONSTANTS
    const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
      name: 'Farcaster SignedKeyRequestValidator', // EIP-712 domain data for the SignedKeyRequestValidator.
      version: '1',
      chainId: optimism.id,
      verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`
    };

    // DO NOT CHANGE ANY VALUES IN THIS CONSTANT
    const SIGNED_KEY_REQUEST_TYPE = [
      { name: 'requestFid', type: 'uint256' },
      { name: 'key', type: 'bytes' },
      { name: 'deadline', type: 'uint256' }
    ];

    // Convert mnemonic to an account object.
    const account = mnemonicToAccount(WARPCAST_NOTIFICATION_ACCOUNT_SEED);

    log.info('✅ Account for publishing messages to farcaster:', account.address);

    // Lookup user details using the custody address.
    const farcasterDeveloper = await lookupUserByCustodyAddress(account.address);

    log.info(
      `✅ Detected user with fid ${farcasterDeveloper.fid} and custody address: ${farcasterDeveloper.custody_address}`
    );

    // Generates an expiration date for the signature
    // e.g. 1693927665
    const deadline = Math.floor(Date.now() / 1000) + 86400 * 365; // signature is valid for 365 days from now

    // Signing the key request data.
    let signature = await account.signTypedData({
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: {
        SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE
      },
      primaryType: 'SignedKeyRequest',
      message: {
        requestFid: BigInt(farcasterDeveloper.fid),
        key: signerPublicKey,
        deadline: BigInt(deadline)
      }
    });

    // Encoding ABI parameters for the metadata.
    const metadata = encodeAbiParameters(SignedKeyRequestMetadataABI.inputs, [
      {
        requestFid: BigInt(farcasterDeveloper.fid),
        requestSigner: account.address,
        signature,
        deadline: BigInt(deadline)
      }
    ]);

    // Interacting with a blockchain contract to get a nonce value.
    const developerKeyGatewayNonce = await viemPublicClient.readContract({
      address: '0x00000000fc56947c7e7183f8ca4b62398caadf0b', // gateway address
      abi: keyGatewayAbi,
      functionName: 'nonces',
      args: [farcasterDeveloper.custody_address as `0x${string}`]
    });

    // Additional EIP-712 domain and type definitions for the key gateway.
    const KEY_GATEWAY_EIP_712_DOMAIN = {
      name: 'Farcaster KeyGateway',
      version: '1',
      chainId: 10,
      verifyingContract: '0x00000000fc56947c7e7183f8ca4b62398caadf0b' as `0x${string}`
    };

    // Signing data for the Add operation.
    const ADD_TYPE = [
      { name: 'owner', type: 'address' },
      { name: 'keyType', type: 'uint32' },
      { name: 'key', type: 'bytes' },
      { name: 'metadataType', type: 'uint8' },
      { name: 'metadata', type: 'bytes' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ];

    signature = await account.signTypedData({
      domain: KEY_GATEWAY_EIP_712_DOMAIN,
      types: {
        Add: ADD_TYPE
      },
      primaryType: 'Add',
      message: {
        owner: account.address,
        keyType: 1,
        key: signerPublicKey,
        metadataType: 1,
        metadata,
        nonce: BigInt(developerKeyGatewayNonce),
        deadline: BigInt(deadline)
      }
    });

    // Logging instructions and values for the user to perform on-chain transactions.
    log.info('✅ Generated signer', '\n');

    log.info(
      'In order to get an approved signer you need to do an on-chain transaction on OP mainnet. \nGo to Farcaster KeyGateway optimism explorer\nhttps://optimistic.etherscan.io/address/0x00000000fc56947c7e7183f8ca4b62398caadf0b#writeContract \n'
    );
    log.info(
      'Connect to Web3.\n\nNavigate to `addFor` function and add following values inside the respective placeholders.\n'
    );

    log.info('fidOwner (address) :=> ', farcasterDeveloper.custody_address, '\n -');
    log.info('keyType (uint32) :=> ', 1, '\n -');
    log.info('key (bytes) :=> ', signerPublicKey, '\n -');
    log.info('metadataType (uint8) :=> ', 1, '\n -');
    log.info('metadata (bytes) :=> ', metadata, '\n -');
    log.info('deadline (uint256) :=> ', deadline, '\n -');
    log.info('sig (bytes) :=> ', signature, '\n -\n');
    log.info(
      'We are polling for the signer to be approved. It will be approved once the onchain transaction is confirmed.'
    );
    log.info('Checking for the status of signer...');

    // Polling for the signer status until it is approved.
    while (true) {
      const res = await lookupSigner(signerId);
      if (res && res.status === SignerStatusEnum.Approved) {
        log.info('✅ Approved signer', signerId);
        break;
      }
      log.info('Waiting for signer to be approved...');
      await sleep(4000);
    }

    log.info('✅ Transaction confirmed\n');
    log.info('✅ Approved signer', signerId, '\n');

    return signerId;
  } catch (error) {
    log.error(`Error fetching signer from Neynar`, { error });
    throw error;
  }
};

getApprovedSignerId();
