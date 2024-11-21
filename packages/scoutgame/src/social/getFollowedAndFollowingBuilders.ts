import { fetchQueryWithPagination, init } from '@airstack/node';
import { gql } from '@apollo/client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

import { currentSeason } from '../dates';

init(process.env.AIRSTACK_API_KEY as string, 'prod');

function getBuildersWithFarcasterIds(): Promise<number[]> {
  return prisma.scout
    .findMany({
      where: {
        builderNfts: {
          some: {
            season: currentSeason
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
      followerAddress: {
        socials: {
          dappName: string;
          profileName: string;
        }[];
      };
    }[];
    pageInfo: {
      nextCursor: string;
    };
  };
};

async function getBuildersFollowingUser({ fid }: { fid: number }) {
  const uniqueBuilderFids = await getBuildersWithFarcasterIds();
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
          followerAddress {
            socials(input: { filter: { dappName: { _eq: farcaster } } }) {
              dappName
              profileName
            }
          }
        }
        pageInfo {
        nextCursor
        }
      }
    }
  `;

  const records: SocialFollowersResponse['SocialFollowers']['Follower'] = [];

  async function fetchData(cursor?: string) {
    const { data, hasNextPage } = await fetchQueryWithPagination(query, {
      fid: fid.toString(),
      selectedFids: uniqueBuilderFids.map(String),
      cursor
    });

    const typedData = data as SocialFollowersResponse;

    prettyPrint({ typedData });

    if (typedData.SocialFollowers.Follower) {
      records.push(...typedData.SocialFollowers.Follower);

      if (hasNextPage && typedData.SocialFollowers.pageInfo.nextCursor) {
        return fetchData(typedData.SocialFollowers.pageInfo.nextCursor);
      }
    }
  }

  await fetchData();

  return records.map((record) => record.followerProfileId);
}
