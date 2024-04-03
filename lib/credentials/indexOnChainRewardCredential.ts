import { InvalidInputError } from '@charmverse/core/errors';
import type { CredentialEventType, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { RateLimit } from 'async-sema';
import { getChainById } from 'connectors/chains';

import { getPublicClient } from 'lib/blockchain/publicClient';
import { lowerCaseEqual, prettyPrint } from 'lib/utils/strings';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { rewardSubmissionApprovedVerb } from './constants';
import type { RewardCredential } from './schemas/reward';
import { decodeRewardCredential } from './schemas/reward';

type IndexableCredential = {
  attestationId: string;
};

async function getRewardContentToIndex({
  chainId,
  attestationId,
  eas
}: IndexableCredential & {
  eas: EAS;
  chainId: EasSchemaChain;
}): Promise<Prisma.IssuedCredentialCreateManyInput | null> {
  const attestation = await eas.getAttestation(attestationId);

  const decodedContent = decodeRewardCredential(attestation.data) as RewardCredential;

  const applicationPermalinkId = decodedContent.rewardURL.split('/').pop();

  if (!applicationPermalinkId || !stringUtils.isUUID(applicationPermalinkId)) {
    throw new InvalidInputError(`Invalid page permalink ID for credential ${attestationId} on ${chainId}`);
  }

  // Sanity check to ensure the application exists in our db
  const application = await prisma.application.findFirstOrThrow({
    where: {
      id: applicationPermalinkId
    },
    select: {
      id: true,
      bounty: {
        select: {
          id: true,
          spaceId: true,
          selectedCredentialTemplates: true,
          space: {
            select: {
              credentialsWallet: true
            }
          }
        }
      },
      spaceId: true,
      applicant: true
    }
  });

  if (!lowerCaseEqual(application.bounty.space.credentialsWallet, attestation.attester)) {
    throw new InvalidInputError(
      `Application ${application.id} was issued on chain ${chainId} by ${attestation.recipient}, but credentials wallet is ${application.bounty.space.credentialsWallet}`
    );
  }

  const credentialEvent: CredentialEventType | null = decodedContent.Event.match(rewardSubmissionApprovedVerb)
    ? 'reward_submission_approved'
    : null;

  if (!credentialEvent) {
    throw new InvalidInputError(`Invalid event ${decodedContent.Event} for credential ${attestationId} on ${chainId}`);
  }

  const matchingCredentialTemplate = await prisma.credentialTemplate.findFirstOrThrow({
    where: {
      spaceId: application.bounty.spaceId,
      name: decodedContent.Name,
      description: decodedContent.Description,
      id: {
        in: application.bounty.selectedCredentialTemplates
      }
    }
  });

  const existingCredential = await prisma.issuedCredential.findFirst({
    where: {
      onchainChainId: chainId,
      onchainAttestationId: attestationId
    }
  });

  // If we already indexed this attestation, no need to reindex it
  if (existingCredential) {
    return null;
  }

  return {
    credentialEvent,
    credentialTemplateId: matchingCredentialTemplate.id,
    userId: application.applicant.id,
    rewardApplicationId: application.id,
    schemaId: attestation.schema,
    onchainChainId: chainId,
    onchainAttestationId: attestationId
  };
}

// Avoid spamming RPC with requests
const limiter = RateLimit(10);

export type RewardCredentialsToIndex = {
  chainId: EasSchemaChain;
  txHash: string;
};

export async function indexRewardCredentials({ chainId, txHash }: RewardCredentialsToIndex): Promise<void> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationUids = receipt.logs.map((_log) => _log.data);

  const eas = await getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  const issuedCredentialInputs = await Promise.all(
    attestationUids.map(async (uid) => {
      await limiter();
      return getRewardContentToIndex({ attestationId: uid, chainId, eas });
    })
  );

  await prisma.issuedCredential.createMany({
    data: issuedCredentialInputs.filter((input): input is Prisma.IssuedCredentialCreateManyInput => !!input)
  });
}

// indexSafeTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x410992d91c8f58919db7605e8555232497b942f95950a51c0734a1cc6da23883'
// }).then(console.log);

// indexSafeTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x6ee2a4967da40389b76a03de7c38a5b45ab48f0fc19baf909387c512207a8841'
// }).then(console.log);
