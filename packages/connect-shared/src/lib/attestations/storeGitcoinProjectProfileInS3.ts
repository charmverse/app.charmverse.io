import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { DataNotFoundError } from '@packages/core/errors';
import { getAttestationS3Path } from '@packages/credentials/getAttestationS3Path';
import { gitcoinProjectCredentialSchemaId } from '@packages/credentials/schemas/gitcoinProjectSchema';
import { awsS3Bucket } from '@packages/utils/constants';
import { replaceS3Domain } from '@packages/utils/url';

import { findProject } from '../projects/findProject';

type GitcoinUserProfile = {
  name: string;
  profileImageUrl: string;
  bannerImageUrl: string;
};

export async function storeGitcoinProjectProfileInS3({
  projectId
}: {
  projectId: string;
}): Promise<{ staticFilePath: string; profile: GitcoinUserProfile }> {
  const project = await findProject({ id: projectId });

  if (!project) {
    throw new DataNotFoundError('Project not found');
  }

  const userProfile = await prisma.farcasterUser.findFirstOrThrow({
    where: {
      userId: project.createdBy
    },
    select: {
      account: true
    }
  });

  const fcProfile = userProfile.account as Required<FarcasterBody>;

  const filePath = getAttestationS3Path({
    schemaId: gitcoinProjectCredentialSchemaId,
    charmverseId: project.id,
    charmverseIdType: 'profile'
  });

  const profile: GitcoinUserProfile = {
    name: fcProfile.username,
    profileImageUrl: fcProfile.pfpUrl || project.avatar || '',
    bannerImageUrl: project.coverImage || ''
  };

  await uploadFileToS3({
    pathInS3: filePath,
    content: Buffer.from(JSON.stringify(profile)),
    contentType: 'application/json'
  });

  return { staticFilePath: replaceS3Domain(`https://s3.amazonaws.com/${awsS3Bucket}/${filePath}`), profile };
}
