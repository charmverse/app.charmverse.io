import { Box, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import { ExtendedPoap } from 'models';
import { NftData } from 'lib/nft/interfaces';
import AggregatedData from './components/AggregatedData';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import { Collective, ProfileItemsList } from './components/ProfileItems';
import CommunityRow, { CommunityDetails } from './components/CommunityRow';

function transformPoap (poap: ExtendedPoap): Collective {
  return {
    type: 'poap',
    date: poap.created as string,
    id: poap.tokenId,
    image: poap.imageURL,
    title: poap.name,
    link: `https://app.poap.xyz/token/${poap.tokenId}`,
    isHidden: poap.isHidden
  };
}

function transformNft (nft: NftData): Collective {
  return {
    type: 'nft',
    date: nft.timeLastUpdated,
    id: nft.tokenId,
    image: nft.image ?? nft.imageThumb,
    title: nft.title,
    link: '',
    isHidden: nft.isHidden
  };
}

export default function PublicProfile (props: UserDetailsProps) {
  const { user } = props;
  const { data, mutate, isValidating: isAggregatedDataValidating } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });
  const isPublic = isPublicUser(user);

  const { data: poapData, mutate: mutatePoaps, isValidating: isPoapDataValidating } = useSWRImmutable(`/poaps/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve(user.visiblePoaps as ExtendedPoap[])
      : charmClient.getUserPoaps();
  });

  const { data: nftData, mutate: mutateNfts, isValidating: isNftDataValidating } = useSWRImmutable(`/nfts/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve(user.visibleNfts)
      : charmClient.nft.list(user.id);
  });

  const isLoading = !data || !poapData || !nftData || isNftDataValidating || isPoapDataValidating || isAggregatedDataValidating;

  const collectives: Collective[] = [];

  poapData?.forEach(poap => {
    collectives.push(transformPoap(poap));
  });

  nftData?.forEach(nft => {
    collectives.push(transformNft(nft));
  });

  async function updateDaoProfileItem (community: CommunityDetails) {
    await charmClient.profile.updateProfileItem({
      profileItems: [{
        id: community.id,
        isHidden: !community.isHidden,
        type: 'community',
        metadata: null
      }]
    });
    mutate((aggregateData) => {
      return aggregateData ? {
        ...aggregateData,
        communities: aggregateData.communities.map(comm => {
          if (comm.id === community.id) {
            return {
              ...comm,
              isHidden: !community.isHidden
            };
          }
          return comm;
        })
      } : undefined;
    }, {
      revalidate: false
    });
  }

  const communities = (data?.communities ?? []).filter((community) => isPublic ? !community.isHidden : true);

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      {
        isLoading ? (
          <Box display='flex' alignItems='center' gap={1}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <AggregatedData
              totalBounties={data.bounties}
              totalCommunities={communities.length}
              totalProposals={data.totalProposals}
              totalVotes={data.totalVotes}
            />
            {communities.length !== 0 ? (
              <>
                <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
                  <SectionTitle>
                    Communities
                  </SectionTitle>
                  <Chip label={communities.length} />
                </Stack>
                <Stack gap={2}>
                  {communities.map(community => (
                    <Box
                      key={community.id}
                    >
                      <CommunityRow
                        onClick={() => {
                          updateDaoProfileItem(community);
                        }}
                        visible={!community.isHidden}
                        showVisibilityIcon={!isPublic}
                        community={community}
                      />
                      <Divider sx={{
                        mt: 2
                      }}
                      />
                    </Box>
                  ))}
                </Stack>
              </>
            ) : null}

            {collectives.length ? (
              <Box>
                <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
                  <SectionTitle>
                    NFTs & POAPs
                  </SectionTitle>
                  <Chip label={collectives.length} />
                </Stack>
                <ProfileItemsList
                  collectives={collectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1)}
                  isPublic={isPublic}
                  mutateNfts={mutateNfts}
                  mutatePoaps={mutatePoaps}
                />
              </Box>
            ) : null}
          </>
        )
      }
    </Stack>
  );
}

function SectionTitle ({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: {
          sm: '2em',
          xs: '1.2em'
        },
        fontWeight: 700
      }}
    >
      {children}
    </Typography>
  );
}
