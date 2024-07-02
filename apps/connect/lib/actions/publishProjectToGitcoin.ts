'use server';

import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { optimismSepolia } from 'viem/chains';
import * as yup from 'yup';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { attestOnchain } from 'lib/credentials/attestOnchain';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

const schema = yup.object({
  projectId: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

const sampleJson = {
  name: 'Project Phoenix',
  bio: 'Revitalizing communities through sustainable solutions.',
  websiteUrl: 'https://www.projectphoenix.org',
  payoutAddress: '0x1234567890abcdef1234567890abcdef12345678',
  contributionDescription: 'Developed an open-source platform for community-led initiatives.',
  impactDescription: 'Improving community engagement and sustainable practices.',
  impactCategory: ['Community Development', 'Sustainability'],
  contributionLinks: [
    {
      description: 'Main contract repository',
      type: 'GITHUB_REPO',
      url: 'https://github.com/projectphoenix/main-repo'
    },
    {
      description: 'Smart contract address',
      type: 'CONTRACT_ADDRESS',
      url: 'https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678'
    }
  ],
  impactMetrics: [
    {
      description: 'Number of active users',
      url: 'https://projectphoenix.org/metrics/users',
      number: 5000
    },
    {
      description: 'Tons of waste reduced',
      url: 'https://projectphoenix.org/metrics/waste',
      number: 120
    }
  ],
  fundingSources: [
    {
      description: 'Initial seed funding',
      amount: 50000,
      currency: 'USD',
      type: 'PARTNER_FUND'
    },
    {
      description: 'Revenue from services',
      amount: 20000,
      currency: 'USD',
      type: 'REVENUE'
    }
  ]
};

export const actionPublishProjectToGitcoin = authActionClient
  .metadata({ actionName: 'publishProjectToGitcoin' })
  .schema(schema)
  .action(async ({ ctx, parsedInput }) => {
    const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
      where: {
        userId: ctx.session.user.id
      },
      select: {
        account: true,
        fid: true
      }
    });

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        id: parsedInput.projectId
      }
    });

    const fcProfile = await getFarcasterProfile({
      fid: farcasterUser.fid
    });

    if (!fcProfile) {
      throw new DataNotFoundError('Farcaster profile not found');
    }

    const storedJson = {
      ...sampleJson,
      name: project.name
    };

    const filePath = `connect/projects/${project.id}/project.json`;

    await uploadFileToS3({
      pathInS3: filePath,
      content: Buffer.from(JSON.stringify(storedJson)),
      contentType: 'application/json'
    });

    await attestOnchain({
      type: 'gitcoinProject',
      chainId: optimismSepolia.id,
      credentialInputs: {
        recipient: fcProfile.connectedAddress ?? fcProfile.connectedAddresses[0] ?? fcProfile.body.address,
        data: {
          name: project.name,
          metadataPtr: `https://s3.amazonaws.com/${awsS3Bucket}/${filePath}`,
          metadataType: 1,
          type: 'gitcoinProject',
          round: '1'
        }
      }
    });

    return { success: true };
  });
