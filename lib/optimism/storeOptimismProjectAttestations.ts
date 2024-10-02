import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { GET } from '@root/adapters/http';
import type { EASAttestationFromApi } from '@root/lib/credentials/external/getOnchainCredentials';
import { getTrackedOnChainCredentials } from '@root/lib/credentials/external/getOnchainCredentials';
import { isTruthy } from '@root/lib/utils/types';
import { optimism } from 'viem/chains';

type OptimismProjectAttestation = {
  farcasterID: { hex: string };
  issuer: string;
};

type OptimismProjectMetadataAttestation = {
  projectRefUID: string;
  farcasterID: {
    type: string;
    hex: string;
  };
  name: string;
  category: string;
  parentProjectRefUID: string;
  metadataType: number;
  metadataUrl: string;
};

export type OptimismProjectMetadata = {
  name: string;
  description: string;
  projectAvatarUrl: string;
  projectCoverImageUrl: string;
  category: string;
  osoSlug: string;
  socialLinks: {
    website: string[];
    farcaster: string[];
    twitter: string;
    mirror: null | string;
  };
  team: string[];
  github: string[];
  packages: string[];
  contracts: {
    address: string;
    deploymentTxHash: string;
    deployerAddress: string;
    chainId: number;
  }[];
  grantsAndFunding: {
    ventureFunding: {
      amount: string;
      details: string;
      year: string;
    }[];
    grants: {
      grant: string;
      link: string | null;
      amount: string;
      date: string;
      details: string;
    }[];
    revenue: {
      amount: string;
      details: string;
    }[];
  };
};

const optimismProjectAttestationSchemaId = '0x7ae9f4adabd9214049df72f58eceffc48c4a69e920882f5b06a6c69a3157e5bd';
const optimismProjectMetadataAttestationSchemaId = '0xe035e3fe27a64c8d7291ae54c6e85676addcbc2d179224fe7fc1f7f05a8c6eac';

export async function storeOptimismProjectAttestations() {
  const optimismAttestations = await getTrackedOnChainCredentials<
    typeof optimism.id,
    OptimismProjectMetadataAttestation | OptimismProjectAttestation
  >({
    chainId: optimism.id,
    schemas: {
      [optimism.id]: [
        {
          schemaId: optimismProjectMetadataAttestationSchemaId
        },
        {
          schemaId: optimismProjectAttestationSchemaId
        }
      ]
    },
    type: 'onchain'
  });

  const optimismProjectMetadataAttestationRecord = optimismAttestations
    .filter((attestation) => attestation.schemaId === optimismProjectMetadataAttestationSchemaId)
    .reduce((acc, attestation) => {
      const projectRefUid = (attestation.content as OptimismProjectMetadataAttestation).projectRefUID;
      acc[projectRefUid] = attestation as EASAttestationFromApi<OptimismProjectMetadataAttestation>;
      return acc;
    }, {} as Record<string, EASAttestationFromApi<OptimismProjectMetadataAttestation>>);

  const optimismProjectAttestationRecord = optimismAttestations
    .filter(
      (attestation) =>
        attestation.schemaId === optimismProjectAttestationSchemaId &&
        optimismProjectMetadataAttestationRecord[attestation.id]
    )
    .reduce((acc, attestation) => {
      acc[attestation.id] = attestation as EASAttestationFromApi<OptimismProjectAttestation>;
      return acc;
    }, {} as Record<string, EASAttestationFromApi<OptimismProjectAttestation>>);

  let totalUpdatedProjects = 0;

  for (const optimismProjectAttestation of Object.values(optimismProjectAttestationRecord).filter(
    (attestation) => parseInt(attestation.content.farcasterID.hex, 16) === 290639
  )) {
    const optimismProjectMetadataAttestation = optimismProjectMetadataAttestationRecord[optimismProjectAttestation.id];
    try {
      const optimismProjectMetadata = await GET<OptimismProjectMetadata>(
        optimismProjectMetadataAttestation.content.metadataUrl
      );
      const farcasterIds = Array.from(
        new Set([
          ...(optimismProjectMetadata
            ? optimismProjectMetadata.team
                .map((teamMember) => {
                  if (teamMember.startsWith('0x')) {
                    return parseInt(teamMember, 16);
                  } else if (!Number.isNaN(parseInt(teamMember))) {
                    return parseInt(teamMember);
                  }
                  return null;
                })
                .filter(isTruthy)
            : [])
        ])
      );

      await prisma.optimismProjectAttestation.upsert({
        where: {
          projectRefUID: optimismProjectAttestation.id
        },
        create: {
          projectRefUID: optimismProjectAttestation.id,
          name: optimismProjectMetadata.name,
          metadataAttestationUID: optimismProjectMetadataAttestation.id,
          metadata: optimismProjectMetadata,
          metadataUrl: optimismProjectMetadataAttestation.content.metadataUrl,
          farcasterIds,
          timeCreated: new Date(optimismProjectAttestation.timeCreated),
          chainId: optimism.id
        },
        update: {
          name: optimismProjectMetadata.name,
          metadata: optimismProjectMetadata,
          metadataUrl: optimismProjectMetadataAttestation.content.metadataUrl,
          farcasterIds
        }
      });
      totalUpdatedProjects += 1;
    } catch (err) {
      log.error(`Failed to store metadata for project ${optimismProjectAttestation.id}`, err);
    }
  }

  return totalUpdatedProjects;
}

storeOptimismProjectAttestations();
