import { Box, Chip, Stack } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { SpacesMemberDetails } from 'components/profile/components/SpacesMemberDetails/SpacesMemberDetails';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import type { Collectable, ExtendedPoap } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';
import { transformPoap } from 'lib/blockchain/transformPoap';

import AggregatedData from './components/AggregatedData';
import CollectableRow from './components/CollectibleRow';
import type { CommunityDetails } from './components/CommunityRow';
import CommunityRow from './components/CommunityRow';
import type { UserDetailsProps } from './components/UserDetails';
import UserDetails from './components/UserDetails/UserDetails';
import UserDetailsMini from './components/UserDetails/UserDetailsMini';
import { isPublicUser } from './components/UserDetails/utils';

export function PublicProfile(props: UserDetailsProps) {
  const { user, readOnly } = props;
  const { user: currentUser } = useUser();

  const {
    data,
    mutate,
    isValidating: isAggregatedDataValidating
  } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });
  const isPublic = isPublicUser(user, currentUser);

  const {
    data: poapData,
    mutate: mutatePoaps,
    isValidating: isPoapDataValidating
  } = useSWRImmutable(`/poaps/${user.id}/${isPublic}`, () => {
    return isPublic ? Promise.resolve(user.visiblePoaps as ExtendedPoap[]) : charmClient.getUserPoaps(user.id);
  });

  const {
    data: nftData,
    mutate: mutateNfts,
    isValidating: isNftDataValidating
  } = useSWRImmutable(`/nfts/${user.id}/${isPublic}`, () => {
    return isPublic ? Promise.resolve(user.visibleNfts) : charmClient.blockchain.listNFTs(user.id);
  });

  const isLoading =
    !data || !poapData || !nftData || isNftDataValidating || isPoapDataValidating || isAggregatedDataValidating;

  const collectables: Collectable[] = [];

  poapData?.forEach((poap) => {
    collectables.push(transformPoap(poap));
  });

  nftData?.forEach((nft) => {
    collectables.push(transformNft(nft));
  });

  collectables.sort((itemA, itemB) => (new Date(itemB.date) > new Date(itemA.date) ? 1 : -1));

  async function toggleCommunityVisibility(community: CommunityDetails) {
    await charmClient.profile.updateProfileItem({
      profileItems: [
        {
          id: community.id,
          isHidden: !community.isHidden,
          type: 'community',
          metadata: null,
          isPinned: false
        }
      ]
    });
    mutate(
      (aggregateData) => {
        return aggregateData
          ? {
              ...aggregateData,
              communities: aggregateData.communities.map((comm) => {
                if (comm.id === community.id) {
                  return {
                    ...comm,
                    isHidden: !community.isHidden
                  };
                }
                return comm;
              })
            }
          : undefined;
      },
      {
        revalidate: false
      }
    );
  }

  async function toggleCollectibleVisibility(item: Collectable) {
    await charmClient.profile.updateProfileItem({
      profileItems: [
        {
          id: item.id,
          isHidden: !item.isHidden,
          type: item.type,
          metadata: null,
          isPinned: false
        }
      ]
    });
    if (item.type === 'nft') {
      mutateNfts(
        (_nftData) => {
          return _nftData?.map((nft) => {
            if (nft.id === item.id) {
              return {
                ...nft,
                isHidden: !item.isHidden
              };
            }
            return nft;
          });
        },
        {
          revalidate: false
        }
      );
    } else {
      mutatePoaps(
        (_poapData) => {
          return _poapData?.map((poap) => {
            if (poap.id === item.id) {
              return {
                ...poap,
                isHidden: !item.isHidden
              };
            }
            return poap;
          });
        },
        {
          revalidate: false
        }
      );
    }
  }
  const communities = (data?.communities ?? []).filter((community) => (isPublic ? !community.isHidden : true));

  const allCommunities = communities.sort((commA, commB) => (commB.joinDate > commA.joinDate ? 1 : -1));
  return (
    <Box>
      {readOnly ? <UserDetailsMini {...props} /> : <UserDetails {...props} />}
      <SpacesMemberDetails memberId={user.id} />
      {readOnly && (
        <AggregatedData
          totalBounties={data?.bounties}
          totalCommunities={data ? communities.length : undefined}
          totalProposals={data?.totalProposals}
          totalVotes={data?.totalVotes}
        />
      )}
      <SectionHeader title='My Organizations' count={data ? allCommunities.length : undefined} />
      <LoadingComponent isLoading={isLoading} minHeight={300}>
        {allCommunities.length > 0 ? (
          <Stack gap={2} mb={2}>
            {allCommunities.map((community) => (
              <CommunityRow
                key={community.id}
                onClick={() => {
                  toggleCommunityVisibility(community);
                }}
                visible={!community.isHidden}
                showVisibilityIcon={!readOnly}
                community={community}
              />
            ))}
          </Stack>
        ) : null}

        {collectables.length > 0 ? (
          <>
            <SectionHeader title='NFTs & POAPs' count={collectables.length} />
            <Stack gap={2} mb={2}>
              {collectables.map((collectable) => (
                <CollectableRow
                  key={collectable.id}
                  showVisibilityIcon={!readOnly}
                  visible={!collectable.isHidden}
                  onClick={() => {
                    toggleCollectibleVisibility(collectable);
                  }}
                  collectable={collectable}
                />
              ))}
            </Stack>
          </>
        ) : null}
      </LoadingComponent>
    </Box>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
      <Legend noBorder>{title}</Legend>
      {typeof count !== 'undefined' && <Chip label={count} />}
    </Stack>
  );
}
