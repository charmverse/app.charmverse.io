import { fetchQueryWithPagination, init } from '@airstack/node';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';

const apiKey = process.env.AIRSTACK_API_KEY;

if (apiKey) {
  init(process.env.AIRSTACK_API_KEY as string, 'prod');
}

function getBuildersWithFarcasterIds({ season }: { season: string }): Promise<number[]> {
  return prisma.scout
    .findMany({
      where: {
        builderNfts: {
          some: {
            season
          }
        },
        farcasterId: {
          not: null
        }
      },
      select: {
        farcasterId: true
      }
    })
    .then((scouts) => scouts.map((scout) => scout.farcasterId as number));
}

type SocialFollowersResponse = {
  SocialFollowers: {
    Follower: {
      followerProfileId: string;
    }[];
    pageInfo: {
      nextCursor: string;
    };
  };
};

async function getBuildersFollowingUser({
  fid,
  season,
  maxRefetches = 1
}: {
  fid: number;
  season: string;
  maxRefetches?: number;
}): Promise<number[]> {
  const uniqueBuilderFids = await getBuildersWithFarcasterIds({ season });
  // For debugging, replace by this line and reimport gql from '@apollo/client'
  // const query = gql`
  const query = `  
    query GetFarcasterFollowers($fid: String!, $selectedFids: [String!], $cursor: String) {
      SocialFollowers(
        input: {
          blockchain: ALL
          filter: {
            dappName: { _eq: farcaster }
            followingProfileId: { _eq: $fid }
            followerProfileId: { _in: $selectedFids }
          }
          limit: 10
          cursor: $cursor
          order: { blockNumber: ASC }
        }
      ) {
        Follower {
          followerProfileId
        }
        pageInfo {
        nextCursor
        }
      }
    }
  `;

  const records: SocialFollowersResponse['SocialFollowers']['Follower'] = [];

  async function fetchData(cursor?: string, refetchCount = 0) {
    const { data, hasNextPage } = await fetchQueryWithPagination(query, {
      fid: fid.toString(),
      selectedFids: uniqueBuilderFids.map(String),
      cursor
    });

    const typedData = data as SocialFollowersResponse;

    if (typedData?.SocialFollowers?.Follower) {
      records.push(...typedData.SocialFollowers.Follower);

      if (
        hasNextPage &&
        typedData.SocialFollowers.pageInfo.nextCursor &&
        (!maxRefetches || refetchCount < maxRefetches)
      ) {
        return fetchData(typedData.SocialFollowers.pageInfo.nextCursor, refetchCount + 1);
      }
    }
  }

  await fetchData();

  return records.map((record) => Number(record.followerProfileId));
}

type SocialFollowingResponse = {
  SocialFollowings: {
    Following: {
      followingProfileId: string;
    }[];
    pageInfo: {
      nextCursor: string;
    };
  };
};

async function getBuildersFollowedByUser({
  fid,
  season,
  maxRefetches = 1
}: {
  fid: number;
  season: string;
  maxRefetches?: number;
}): Promise<number[]> {
  const uniqueBuilderFids = await getBuildersWithFarcasterIds({ season });
  // For debugging, replace by this line and reimport gql from '@apollo/client'
  // const query = gql`
  const query = `  
    query GetUserFarcasterFollowings($fid: String!, $selectedFids: [String!], $cursor: String) {
  SocialFollowings(
    input: {blockchain: ALL, filter: {dappName: {_eq: farcaster}, followerProfileId: {_eq: $fid}, followingProfileId: {_in: $selectedFids}}, limit: 10, cursor: $cursor, order: {blockNumber: ASC}}
  ) {
    Following {
      followingProfileId
    }
    pageInfo {
      nextCursor
    }
  }
}
  `;

  const records: SocialFollowingResponse['SocialFollowings']['Following'] = [];

  async function fetchData(cursor?: string, refetchCount = 0) {
    const { data, hasNextPage, error } = await fetchQueryWithPagination(query, {
      fid: fid.toString(),
      selectedFids: uniqueBuilderFids.map(String),
      cursor
    });

    const typedData = data as SocialFollowingResponse;

    if (typedData?.SocialFollowings?.Following) {
      records.push(...typedData.SocialFollowings.Following);

      if (
        hasNextPage &&
        typedData.SocialFollowings.pageInfo.nextCursor &&
        (!maxRefetches || refetchCount < maxRefetches)
      ) {
        return fetchData(typedData.SocialFollowings.pageInfo.nextCursor, refetchCount + 1);
      }
    }
  }

  await fetchData();

  return records.map((record) => Number(record.followingProfileId));
}

/**
 * @param maxRefetches - The maximum number of times to auto-follow pagination cursors
 */
export async function getScoutFarcasterBuilderSocialGraph({
  fid,
  season,
  maxRefetches = 1
}: {
  fid: number;
  season: string;
  maxRefetches?: number;
}): Promise<{ following: number[]; followers: number[] }> {
  if (!fid) {
    throw new InvalidInputError('fid is required');
  }

  const [following, followers] = await Promise.all([
    getBuildersFollowedByUser({ fid, season, maxRefetches }),
    getBuildersFollowingUser({ fid, season, maxRefetches })
  ]);

  return {
    following,
    followers
  };
}
