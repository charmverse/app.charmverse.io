import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import { sortCommunities } from 'lib/profile/sortCommunities';
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
  const { data, mutate } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });
  const isPublic = isPublicUser(user);

  const sortedCommunities = data ? sortCommunities(data) : [];

  const visibleCommunities: CommunityDetails[] = [];
  const hiddenCommunities: CommunityDetails[] = [];
  sortedCommunities.forEach(comm => {
    if (comm.isHidden) {
      hiddenCommunities.push(comm);
    }
    else {
      visibleCommunities.push(comm);
    }
  });

  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve(user.visiblePoaps as ExtendedPoap[])
      : charmClient.getUserPoaps();
  });

  const { data: nftData, mutate: mutateNfts } = useSWRImmutable(`/nfts/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve(user.visibleNfts)
      : charmClient.nft.list(user.id);
  });

  const hiddenCollectives: Collective[] = [];
  const visibleCollectives: Collective[] = [];

  poapData?.forEach(poap => {
    if (poap.isHidden) {
      hiddenCollectives.push(transformPoap(poap));
    }
    else {
      visibleCollectives.push(transformPoap(poap));
    }
  });

  nftData?.forEach(nft => {
    if (nft.isHidden) {
      hiddenCollectives.push(transformNft(nft));
    }
    else {
      visibleCollectives.push(transformNft(nft));
    }
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

  const totalHiddenItems = hiddenCollectives.length + hiddenCommunities.length;

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <AggregatedData user={user} />
      {data && visibleCommunities.length !== 0 ? (
        <>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
            <SectionTitle>
              Communities
            </SectionTitle>
            <Chip label={visibleCommunities.length} />
          </Stack>
          <Stack gap={2}>
            {visibleCommunities.map(community => (
              <Box
                key={community.id}
              >
                <CommunityRow
                  onClick={() => {
                    updateDaoProfileItem(community);
                  }}
                  visible={true}
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

      {visibleCollectives.length ? (
        <Box>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
            <SectionTitle>
              NFTs & POAPs
            </SectionTitle>
            <Chip label={visibleCollectives.length} />
          </Stack>
          <ProfileItemsList
            collectives={visibleCollectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1)}
            isPublic={isPublic}
            mutateNfts={mutateNfts}
            mutatePoaps={mutatePoaps}
          />
        </Box>
      ) : null}

      {totalHiddenItems && !isPublic && data ? (
        <Box>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={1}>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}
              color='secondary'
            >
              Hidden items
            </Typography>
            <Chip label={hiddenCollectives.length + hiddenCommunities.length} />
          </Stack>
          <Stack gap={2} my={1}>
            {hiddenCommunities.map(community => (
              <Box
                key={community.id}
              >
                <CommunityRow
                  onClick={() => {
                    updateDaoProfileItem(community);
                  }}
                  visible={false}
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
          <ProfileItemsList
            collectives={hiddenCollectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1)}
            isPublic={isPublic}
            mutateNfts={mutateNfts}
            mutatePoaps={mutatePoaps}
          />
        </Box>
      ) : null}
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
