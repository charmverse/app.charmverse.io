import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { revokeAgoraProjectAttestation } from '@packages/connect-shared/lib/attestations/agoraApi';
import type { EasSchemaChain } from '@root/lib/credentials/connectors';
import { revokeAttestation } from '@root/lib/credentials/revokeAttestation';

export async function softDeleteAndRevokeSunnyAwardsProject({ projectId }: { projectId: string }) {
  if (!stringUtils.isUUID(projectId)) {
    throw new InvalidInputError(`Invalid project ID: ${projectId}`);
  }

  const project = await prisma.project.findFirstOrThrow({
    where: {
      id: projectId,
      // Ensure we are only deleting sunny awards projects
      source: 'sunny_awards'
    },
    select: {
      pptimismProjectAttestations: true,
      gitcoinProjectAttestations: {
        where: {
          type: 'application'
        }
      },
      charmProjectCredentials: true
    }
  });

  await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      deletedAt: new Date()
    }
  });

  await Promise.all(
    project.pptimismProjectAttestations.map((attestation) =>
      revokeAgoraProjectAttestation({ projectRefUID: attestation.projectRefUID }).then(() => attestation.projectRefUID)
    )
  ).then(async (revokedAttestations) => {
    if (revokedAttestations.length > 0) {
      await prisma.optimismProjectAttestation.updateMany({
        where: {
          projectRefUID: {
            in: revokedAttestations
          }
        },
        data: {
          projectAttestationRevoked: true
        }
      });
    }
  });

  for (const attestation of project.gitcoinProjectAttestations) {
    await revokeAttestation({
      attestationUID: attestation.attestationUID,
      chainId: attestation.chainId as EasSchemaChain
    });

    await prisma.gitcoinProjectAttestation.update({
      where: {
        id: attestation.id
      },
      data: {
        projectAttestationRevoked: true
      }
    });
  }

  for (const attestation of project.charmProjectCredentials) {
    await revokeAttestation({
      attestationUID: attestation.projectRefUID,
      chainId: attestation.chainId as EasSchemaChain
    });

    await prisma.charmProjectCredential.update({
      where: {
        projectRefUID: attestation.projectRefUID
      },
      data: {
        projectAttestationRevoked: true
      }
    });
  }
}
