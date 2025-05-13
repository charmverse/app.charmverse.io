import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { CredentialEventType, IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { lowerCaseEqual } from '@packages/utils/strings';
import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { RateLimit } from 'async-sema';

import { getEasConnector, type EasSchemaChain } from './connectors';
import { rewardSubmissionApprovedVerb } from './constants';
import { getEasInstance } from './getEasInstance';
import { saveIssuedCredential } from './saveIssuedCredential';
import type { RewardCredential } from './schemas/reward';
import { decodeRewardCredential } from './schemas/rewardUtils';

type IndexableCredential = {
  attestationId: string;
};

async function indexSingleOnchainRewardCredential({
  chainId,
  attestationId,
  eas
}: IndexableCredential & {
  eas: EAS;
  chainId: EasSchemaChain;
}): Promise<IssuedCredential> {
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
      issuedCredentials: true,
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

  const existingCredential = application.issuedCredentials.find((cred) => cred.onchainAttestationId === attestationId);

  if (existingCredential) {
    return existingCredential;
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

  const issuedCredential = await saveIssuedCredential({
    credentialProps: {
      credentialEvent,
      credentialTemplateId: matchingCredentialTemplate.id,
      schemaId: attestation.schema,
      userId: application.applicant.id,
      rewardApplicationId: application.id
    },
    onChainData: {
      onchainChainId: chainId,
      onchainAttestationId: attestationId
    }
  });

  return issuedCredential;
}

// Avoid spamming RPC with requests
const limiter = RateLimit(10);

export type RewardCredentialsToIndex = {
  chainId: EasSchemaChain;
  txHash: string;
};

export async function indexOnchainRewardCredentials({
  chainId,
  txHash
}: RewardCredentialsToIndex): Promise<IssuedCredential[]> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationContract = getEasConnector(chainId).attestationContract;

  const attestationUids = receipt.logs
    .filter((txLog) => lowerCaseEqual(txLog.address, attestationContract))
    .map((txLog) => txLog.data);

  const eas = await getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  const credentials = await Promise.all(
    attestationUids.map(async (uid) => {
      await limiter();
      return indexSingleOnchainRewardCredential({ attestationId: uid, chainId, eas }).catch((error) => {
        log.error(`Failed to index credential ${uid} on ${chainId}`, { error });
        return null;
      });
    })
  ).then((data) => data.filter(Boolean));

  return credentials as IssuedCredential[];
}
