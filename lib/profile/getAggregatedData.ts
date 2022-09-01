import { prisma } from 'db';
import log from 'lib/log';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { getAllOrganizations, getProfile } from 'lib/deepdao/client';
import { DeepDaoProfile, DeepDaoVote } from 'lib/deepdao/interfaces';
import { CommunityDetails } from 'components/profile/components/CommunityRow';
import { UserCommunity, ProfileBountyEvent } from './interfaces';
import { combineCommunityData } from './combineCommunityData';

export type AggregatedProfileData = Pick<DeepDaoProfile, 'totalProposals' | 'totalVotes'> & {
  bounties: number;
  communities: CommunityDetails[];
};

export async function getAggregatedData (userId: string, apiToken?: string): Promise<AggregatedProfileData> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId as string
    }
  });

  if (!user) {
    throw new DataNotFoundError();
  }

  const profiles = (await Promise.all(
    user.addresses.map(address => getProfile(address, apiToken)
      .catch(error => {
        log.error('Error calling DEEP DAO API', error);
        return null;
      }))
  )).filter(isTruthy);

  const [
    allOrganizations,
    bountiesCreated,
    bountyApplications,
    userWorkspaces
  ] = await Promise.all([
    getAllOrganizations(apiToken),
    prisma.bounty.findMany({
      where: {
        createdBy: user.id
      },
      include: {
        page: true
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
            page: true
          }
        }
      }
    }),
    getSpacesOfUser(user.id)
  ]);

  const daoLogos = allOrganizations.data.resources.reduce<Record<string, string | null>>((logos, org) => {
    logos[org.organizationId] = org.logo;
    return logos;
  }, {});

  const completedApplications = bountyApplications.filter(application => application.status === 'complete' || application.status === 'paid');

  const hiddenItems = (await prisma.profileItem.findMany({
    where: {
      type: 'community',
      isHidden: true
    },
    select: {
      id: true
    }
  })).map(profileItem => profileItem.id);

  const userVotes = await prisma.vote.findMany({
    where: {
      spaceId: {
        in: userWorkspaces.map(userWorkspace => userWorkspace.id)
      },
      userVotes: {
        some: {
          userId: user.id
        }
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
          userId: user.id
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

  const deepDaoCommunities: UserCommunity[] = Object.values(profiles)
    .map(profile => profile.data.organizations
      .map(org => ({
        joinDate: '',
        id: org.organizationId,
        isHidden: hiddenItems.includes(org.organizationId),
        name: org.name,
        // sometimes the logo is just a filename, do some basic validation
        logo: daoLogos[org.organizationId]?.includes('http') ? daoLogos[org.organizationId] : null
      }))).flat();

  const charmVerseCommunities: UserCommunity[] = userWorkspaces.map(userWorkspace => ({
    id: userWorkspace.id,
    isHidden: hiddenItems.includes(userWorkspace.id),
    joinDate: userWorkspace.spaceRoles.find(spaceRole => spaceRole.userId === user.id)?.createdAt.toISOString(),
    name: userWorkspace.name,
    logo: userWorkspace.spaceImage
  }));

  const communities = [...deepDaoCommunities, ...charmVerseCommunities];
  const proposals = profiles.reduce<DeepDaoProfile['proposals']>((_proposals, profile) => ([..._proposals, ...profile.data.proposals]), []);
  const votes = [
    // Deepdao votes
    ...profiles.reduce<DeepDaoProfile['votes']>((_votes, profile) => ([..._votes, ...profile.data.votes]), []),
    ...userVotes.map(vote => ({
      createdAt: vote.createdAt.toString(),
      description: vote.description ?? '',
      organizationId: vote.spaceId,
      title: vote.title || vote.page?.title,
      voteId: vote.id,
      successful: vote.status === 'Passed'
    } as DeepDaoVote))
  ];

  const bounties: ProfileBountyEvent[] = [
    ...bountiesCreated.map((bounty): ProfileBountyEvent => ({
      bountyId: bounty.id,
      bountyTitle: bounty.page?.title,
      createdAt: bounty.createdAt.toISOString(),
      organizationId: bounty.spaceId,
      eventName: 'bounty_created'
    })),
    ...bountyApplications.map((app): ProfileBountyEvent => ({
      bountyId: app.bounty.id,
      bountyTitle: app.bounty.page?.title,
      createdAt: app.createdAt.toISOString(),
      organizationId: app.spaceId,
      eventName: (app.status === 'complete' || app.status === 'paid') ? 'bounty_completed' : 'bounty_started'
    }))
  ];

  const sortedCommunities = combineCommunityData({
    communities,
    bounties,
    proposals,
    votes
  });

  return {
    communities: sortedCommunities,
    totalProposals: profiles.reduce((acc, profile) => acc + profile.data.totalProposals, 0),
    totalVotes: profiles.reduce((acc, profile) => acc + profile.data.totalVotes, 0),
    bounties: completedApplications.length
  };
}
