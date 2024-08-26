import { log } from '@charmverse/core/log';
import type { CredentialEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { credentialsWalletPrivateKey } from '@root/config/constants';
import { getChainById } from '@root/connectors/chains';
import { encodeFunctionData } from 'viem';

import { getCurrentGasPrice } from '../blockchain/getCurrentGasPrice';
import { getWalletClient } from '../blockchain/walletClient';

import { getEasConnector, type EasSchemaChain } from './connectors';
import type { CredentialDataInput, ExtendedAttestationType } from './schemas';
import { attestationSchemaIds, encodeAttestation } from './schemas';

export type OnChainAttestationInput<T extends ExtendedAttestationType = ExtendedAttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string | null; data: CredentialDataInput<T> };
  type: T;
};

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const NULL_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const easAbi = [
  {
    name: 'attest',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'schema',
            type: 'bytes32'
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'recipient',
                type: 'address'
              },
              {
                internalType: 'uint64',
                name: 'expirationTime',
                type: 'uint64'
              },
              {
                internalType: 'bool',
                name: 'revocable',
                type: 'bool'
              },
              {
                internalType: 'bytes32',
                name: 'refUID',
                type: 'bytes32'
              },
              {
                internalType: 'bytes',
                name: 'data',
                type: 'bytes'
              },
              {
                internalType: 'uint256',
                name: 'value',
                type: 'uint256'
              }
            ],
            internalType: 'struct AttestationRequestData',
            name: 'data',
            type: 'tuple'
          }
        ],
        internalType: 'struct AttestationRequest',
        name: 'request',
        type: 'tuple'
      }
    ]
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'attester',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'uid',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'schema',
        type: 'bytes32'
      }
    ],
    name: 'Attested',
    type: 'event'
  }
];

export async function attestOnchain<T extends ExtendedAttestationType = ExtendedAttestationType>({
  credentialInputs,
  type,
  chainId
}: OnChainAttestationInput<T>): Promise<string> {
  const schemaId = attestationSchemaIds[type];

  const walletClient = getWalletClient({ chainId, privateKey: credentialsWalletPrivateKey as string });

  const gasPrice = await getCurrentGasPrice({ chainId });

  const easContract = getEasConnector(chainId).attestationContract;

  // Prepare the attestation data according to the provided ABI
  const attestationData = {
    schema: schemaId,
    data: {
      recipient: credentialInputs.recipient ?? NULL_ADDRESS,
      expirationTime: 0, // Use appropriate value
      revocable: true, // Use appropriate value
      refUID: NULL_BYTES32, // Use zero bytes32 if not provided
      data: encodeAttestation({ type, data: credentialInputs.data }),
      value: 0 // Use appropriate value
    }
  };

  const txData = encodeFunctionData({
    abi: easAbi, // The provided ABI
    functionName: 'attest',
    args: [attestationData]
  });

  // Send the transaction using viem
  const txHash = await walletClient.sendTransaction({
    to: easContract, // Your EAS contract address
    data: txData,
    gasPrice, // Set gas price using the fetched value
    value: BigInt(0) // Set value using the appropriate value
  });

  // Wait for the transaction receipt
  const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

  // Decode the event logs to get the attestationUid
  const attestationUid = receipt.logs[0].data;

  log.info(`Issued ${type} credential on chain ${chainId} with attestationUid: ${attestationUid}`);

  return attestationUid as any;
}

export type OnChainAttestationInputWithMetadata<T extends ExtendedAttestationType = ExtendedAttestationType> = {
  credential: OnChainAttestationInput<T>;
  credentialMetadata: {
    event: CredentialEventType;
    proposalId?: string;
    submissionId?: string;
    userId?: string;
    credentialTemplateId?: string;
  };
};

export async function attestOnChainAndRecordCredential({
  credential,
  credentialMetadata
}: OnChainAttestationInputWithMetadata) {
  const attestationUid = await attestOnchain(credential);

  await prisma.issuedCredential.create({
    data: {
      onchainAttestationId: attestationUid,
      onchainChainId: credential.chainId,
      credentialEvent: credentialMetadata.event,
      credentialTemplate: { connect: { id: credentialMetadata.credentialTemplateId } },
      user: { connect: { id: credentialMetadata.userId } },
      schemaId: attestationSchemaIds[credential.type],
      rewardApplication: credentialMetadata.submissionId
        ? { connect: { id: credentialMetadata.submissionId } }
        : undefined,
      proposal: credentialMetadata.proposalId ? { connect: { id: credentialMetadata.proposalId } } : undefined
    }
  });
}
