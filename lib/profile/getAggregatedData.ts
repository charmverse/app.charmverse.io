import type { CommunityDetails } from 'components/profile/components/CommunityRow';
import { prisma } from 'db';
import type { DeepDaoProfile, DeepDaoVote } from 'lib/deepdao/interfaces';

import { combineCommunityData } from './combineCommunityData';
import { getOrgs } from './getOrgs';
import type { ProfileBountyEvent } from './interfaces';

export type AggregatedProfileData = Pick<DeepDaoProfile, 'totalProposals' | 'totalVotes'> & {
  bounties: number;
  communities: CommunityDetails[];
};

export async function getAggregatedData(userId: string, apiToken?: string): Promise<AggregatedProfileData> {
  const { charmverseCommunities, deepdaoCommunities, profiles } = await getOrgs({
    userId,
    apiToken
  });

  const proposals = profiles
    .map((profile) =>
      profile.data.proposals.map((proposal) => ({
        ...proposal,
        // sometimes the title includes the whole body of the proposal with "&&" as a separator
        title: proposal.title?.split('&&')[0]
      }))
    )
    .flat();

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
          type: 'proposal',
          snapshotProposalId: {
            notIn: proposals.map((prop) => prop.proposalId)
          }
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
      description: true,
      title: true,
      id: true,
      createdAt: true,
      userVotes: {
        where: {
          userId
        },
        select: {
          choice: true
        }
      },
      deadline: true,
      voteOptions: true,
      threshold: true,
      type: true,
      status: true
    }
  });

  const communities = [...deepdaoCommunities, ...charmverseCommunities];

  const votes = [
    // Deepdao votes
    ...profiles.reduce<DeepDaoProfile['votes']>((_votes, profile) => [..._votes, ...profile.data.votes], []),
    ...userVotes.map(
      (vote) =>
        ({
          createdAt: vote.createdAt.toString(),
          description: vote.description ?? '',
          organizationId: vote.spaceId,
          title: vote.title || vote.page?.title,
          voteId: vote.id,
          successful: vote.status === 'Passed'
        } as DeepDaoVote)
    )
  ];

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
    communities,
    bounties,
    proposals,
    votes
  });

  return {
    communities: sortedCommunities,
    totalProposals: profiles.reduce((acc, profile) => acc + profile.data.totalProposals, 0) + userProposalsCount,
    totalVotes: profiles.reduce((acc, profile) => acc + profile.data.totalVotes, 0) + userVotes.length,
    bounties: completedApplications.length
  };
}
