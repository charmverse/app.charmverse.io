import { prisma } from '@charmverse/core/prisma-client';
import { projectAttestationChainId } from '@connect-shared/lib/attestations/constants';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { optimism } from 'viem/chains';

/**
 * Use this script to perform database searches.
 */

async function backfillGitcoinEasyRetroPGFAttestations() {

  if (projectAttestationChainId !== optimism.id) {
    throw new Error('Attestations must be backfilled on OP mainnet');
  }

  const projects = await prisma.project.findMany({
    where: {
      source: 'sunny_awards',
      gitcoinProjectAttestations: {
        none: {}
      }
    },
    select: {
      id: true,
      createdBy: true,
    }
  });

  const totalProjects = projects.length;

  // const totalProjects = 1;

  for (let i = 0; i < totalProjects; i++) {
    const project = projects[i];

    await storeProjectMetadataAndPublishGitcoinAttestation({
      userId: project.createdBy,
      projectIdOrPath: project.id
    });

    console.log(`Project attestation stored for project ${i + 1} / ${totalProjects}:`, project.id);
  }

}

backfillGitcoinEasyRetroPGFAttestations();
