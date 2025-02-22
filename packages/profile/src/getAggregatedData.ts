import { prisma } from '@charmverse/core/prisma-client';

import { combineCommunityData } from './combineCommunityData';
import { getUserSpaces } from './getUserSpaces';
import type { CommunityDetails, DeepDaoProfile, ProfileVoteEvent, ProfileBountyEvent } from './interfaces';

export type AggregatedProfileData = Pick<DeepDaoProfile, 'totalProposals' | 'totalVotes'> & {
  bounties: number;
  communities: CommunityDetails[];
};

export async function getAggregatedData(userId: string): Promise<AggregatedProfileData> {
  const charmverseCommunities = await getUserSpaces({
    userId
  });

  const [bountiesCreated, bountyApplications, userProposalsCount] = await Promise.all([
    prisma.bounty.findMany({
      where: {
        createdBy: userId
      },
      include: {
        page: true,
        space: true
      }
    }),
    prisma.application.findMany({
      where: {
        createdBy: userId,
        status: {
          in: ['inProgress', 'complete', 'review', 'paid']
        }
      },
      include: {
        bounty: {
          include: {
            page: true,
            space: true
          }
        }
      }
    }),
    prisma.proposal.count({
      where: {
        page: {
          deletedAt: null,
          type: 'proposal'
        },
        authors: {
          some: {
            userId
          }
        }
      }
    })
  ]);

  const completedApplications = bountyApplications.filter(
    (application) => application.status === 'complete' || application.status === 'paid'
  );

  const userVotes = await prisma.vote.findMany({
    where: {
      spaceId: {
        in: charmverseCommunities.map((userWorkspace) => userWorkspace.id)
      },
      userVotes: {
        some: {
          userId
        }
      },
      page: {
        type: 'proposal'
      }
    },
    select: {
      page: {
        select: {
          title: true
        }
      },
      spaceId: true,
      content: true,
      contentText: true,
      title: true,
      id: true,
      createdAt: true,
      userVotes: {
        where: {
          userId
        },
        select: {
          choices: true
        }
      },
      deadline: true,
      voteOptions: true,
      threshold: true,
      type: true,
      status: true
    }
  });
  const votes = userVotes.map(
    (vote) =>
      ({
        createdAt: vote.createdAt.toString(),
        description: vote.contentText ?? '',
        organizationId: vote.spaceId,
        title: vote.title || vote.page?.title,
        voteId: vote.id,
        successful: vote.status === 'Passed'
      }) as ProfileVoteEvent
  );

  const bounties: ProfileBountyEvent[] = [
    ...bountiesCreated.map(
      (bounty): ProfileBountyEvent => ({
        bountyId: bounty.id,
        bountyPath: `/${bounty.space.domain}/${bounty.page?.path}`,
        bountyTitle: bounty.page?.title,
        createdAt: bounty.createdAt.toISOString(),
        organizationId: bounty.spaceId,
        eventName: 'bounty_created'
      })
    ),
    ...bountyApplications.map(
      (app): ProfileBountyEvent => ({
        bountyId: app.bounty.id,
        bountyPath: `/${app.bounty.space.domain}/${app.bounty.page?.path}`,
        bountyTitle: app.bounty.page?.title,
        createdAt: app.createdAt.toISOString(),
        organizationId: app.spaceId,
        eventName: app.status === 'complete' || app.status === 'paid' ? 'bounty_completed' : 'bounty_started'
      })
    )
  ];

  const sortedCommunities = combineCommunityData({
    communities: charmverseCommunities,
    bounties,
    proposals: [], // TODO: proposals from CharmVerse
    votes
  });

  return {
    communities: sortedCommunities,
    totalProposals: userProposalsCount,
    totalVotes: userVotes.length,
    bounties: completedApplications.length
  };
}
