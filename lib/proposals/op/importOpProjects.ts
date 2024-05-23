import { uuid } from '@bangle.dev/utils';
import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import * as http from 'adapters/http';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { createDraftProposal } from '../createDraftProposal';
import { publishProposal } from '../publishProposal';

export type OPProjectData = {
  avatarUrl: string;
  coverImageUrl: string;
  attestationUid: string;
  approvalAttestationUid: string;
  name: string;
  description: string;
  externalLink: string;
  socialLinks: {
    twitter: string;
    farcaster: string;
    mirror: string;
    website: string;
  };
  team: {
    farcasterId: string;
  }[];
  repositories: string[];
  deployedContracts: {
    address: string;
    chainId: string;
    deployer: string;
    creationBlock: string;
    transactionId: string;
    verificationProof: string;
    openSourceObserverSlug: string;
  }[];
  categories: {
    name: string;
    description: string;
  }[];
  funding: {
    ventureCapital: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    grants: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    optimismGrants: {
      amount: string;
      source: string;
      date: string;
      details: string;
      link: string;
      type: string;
    }[];
  };
};

type GetRoundProjectsResponse = {
  metadata: {
    hasNext: boolean;
    totalReturned: number;
    nextOffset: number;
  };
  projects: OPProjectData[];
};

const baseUrl = 'https://vote.optimism.io/api/v1/retrofunding/rounds/4/projects';
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.AGORA_API_KEY}`
};

export async function importOpProjects() {
  const limit = 100;
  const offset = 0;
  const projects: OPProjectData[] = [];
  let response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset }, { headers });
  projects.push(...response.projects);

  while (response.metadata.totalReturned === limit) {
    const nextOffset = response.metadata.nextOffset;
    response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset: nextOffset }, { headers });
    projects.push(...response.projects);
  }

  const spaceId = '';
  const templateId = '';

  for (const project of projects) {
    const authorIds: string[] = [];
    const farcasterIds = project.team.map((member) => member.farcasterId);
    for (const farcasterId of farcasterIds) {
      const farcasterProfile = await getFarcasterProfile({ username: farcasterId });
      const connectedAddresses = farcasterProfile?.connectedAddresses;
      let charmverseUserWithAddress: User | null = null;

      if (connectedAddresses && connectedAddresses.length) {
        charmverseUserWithAddress = await prisma.user.findFirst({
          where: {
            wallets: {
              some: {
                address: {
                  in: connectedAddresses
                }
              }
            }
          }
        });

        if (!charmverseUserWithAddress) {
          charmverseUserWithAddress = await prisma.user.create({
            data: {
              username: farcasterId,
              path: uuid(),
              claimed: false,
              identityType: 'Farcaster',
              wallets: {
                create: connectedAddresses.map((address) => ({
                  address
                }))
              },
              spaceRoles: {
                create: [
                  {
                    spaceId
                  }
                ]
              }
            }
          });
        }
      }

      if (charmverseUserWithAddress) {
        authorIds.push(charmverseUserWithAddress.id);
      }
    }

    const { proposal } = await createDraftProposal({
      contentType: 'free_form',
      createdBy: authorIds[0],
      spaceId,
      pageType: 'proposal',
      templateId,
      authors: authorIds
    });

    await publishProposal({
      proposalId: proposal.id,
      userId: authorIds[0]
    });
  }
}

importOpProjects();
