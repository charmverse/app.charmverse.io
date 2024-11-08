import { prisma } from '@charmverse/core/prisma-client';
import {
  decodeScoutGameUserProfileAttestation,
  encodeScoutGameUserProfileAttestation,
  type ScoutGameUserProfileAttestation
} from '@charmverse/core/protocol';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { attestOnchain } from './attestOnchain';
import {
  SCOUTGAME_METADATA_PATH_PREFIX,
  scoutGameAttestationChainId,
  scoutGameUserProfileSchemaUid
} from './constants';
import { getAttestion } from './getAttestation';
import { getAttestationMetadataS3Path } from './getAttestationMetadataS3Path';

type ScoutMetadata = {
  path: string;
  displayName: string;
};

export async function createOrGetUserProfile({
  scoutId
}: {
  scoutId: string;
}): Promise<ScoutGameUserProfileAttestation> {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: { id: scoutId }
  });

  if (scout.onchainProfileAttestationUid && scout.onchainProfileAttestationChainId === scoutGameAttestationChainId) {
    const attestation = await getAttestion({ attestationUid: scout.onchainProfileAttestationUid });

    return decodeScoutGameUserProfileAttestation(attestation.data);
  }

  const profile: ScoutMetadata = {
    displayName: scout.displayName,
    path: scout.path
  };

  const { relativePath, fullPath } = getAttestationMetadataS3Path({
    userId: scoutId,
    metadataType: 'profile',
    schemaId: scoutGameUserProfileSchemaUid
  });

  await uploadFileToS3({
    pathInS3: relativePath,
    content: Buffer.from(JSON.stringify(profile, null, 2))
  });

  const data: ScoutGameUserProfileAttestation = {
    id: scoutId,
    metadataUrl: fullPath
  };

  const attestationUid = await attestOnchain({
    schemaId: scoutGameUserProfileSchemaUid,
    data: encodeScoutGameUserProfileAttestation(data)
  });

  await prisma.scout.update({
    where: {
      id: scoutId
    },
    data: {
      onchainProfileAttestationChainId: scoutGameAttestationChainId,
      onchainProfileAttestationUid: attestationUid
    }
  });

  return data;
}
