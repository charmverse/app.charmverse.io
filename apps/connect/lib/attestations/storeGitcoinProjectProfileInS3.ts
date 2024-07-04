import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';

import type { ConnectProjectDetails } from '../actions/fetchProject';
import { fetchProject } from '../actions/fetchProject';

import { mapProjectToGitcoin } from './mapProjectToGitcoin';

const storageFormats = ['gitcoin', 'optimism'] as const;

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
  const project = typeof projectOrProjectId === 'string' ? await fetchProject(projectOrProjectId) : projectOrProjectId;

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

  const filePath = `connect/projects/${project.id}/gitcoin/project-profile.json`;

  const profile: GitcoinUserProfile = {
    name: fcProfile.username,
    profileImageUrl: project.avatar || fcProfile.pfpUrl || '',
    bannerImageUrl: project.coverImage || ''
  };

  await uploadFileToS3({
    pathInS3: filePath,
    content: Buffer.from(JSON.stringify(profile)),
    contentType: 'application/json'
  });

  return { staticFilePath: `https://s3.amazonaws.com/${awsS3Bucket}/${filePath}`, profile };
}
