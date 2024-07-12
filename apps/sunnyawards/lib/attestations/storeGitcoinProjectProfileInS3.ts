import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { awsS3Bucket } from '@root/config/constants';
import { uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { gitcoinProjectCredentialSchemaId } from '@root/lib/credentials/schemas/gitcoinProjectSchema';
import { replaceS3Domain } from '@root/lib/utils/url';

import type { ConnectProjectDetails } from '../projects/getProject';
import { getProject } from '../projects/getProject';

import { getAttestationS3Path } from './getAttestationS3Path';

type GitcoinUserProfile = {
  name: string;
  profileImageUrl: string;
  bannerImageUrl: string;
};

export async function storeGitcoinProjectProfileInS3({
  projectOrProjectId
}: {
  projectOrProjectId: ConnectProjectDetails | string;
}): Promise<{ staticFilePath: string; profile: GitcoinUserProfile }> {
  const project =
    typeof projectOrProjectId === 'string' ? await getProject({ id: projectOrProjectId }) : projectOrProjectId;

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
