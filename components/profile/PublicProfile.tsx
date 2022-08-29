import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import { sortDeepdaoOrgs } from 'lib/deepdao/sortDeepdaoOrgs';
import { ExtendedPoap } from 'models';
import { NftData } from 'lib/nft/interfaces';
import AggregatedData from './components/AggregatedData';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import { Collective, ProfileItemsList } from './components/ProfileItems';
import DeepDaoOrganizationRow, { OrganizationDetails } from './components/DeepDaoOrganizationRow';

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

  const sortedOrganizations = data ? sortDeepdaoOrgs(data) : [];

  const visibleDaos: OrganizationDetails[] = [];
  const hiddenDaos: OrganizationDetails[] = [];
  sortedOrganizations.forEach(dao => {
    if (dao.isHidden) {
      hiddenDaos.push(dao);
    }
    else {
      visibleDaos.push(dao);
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

  async function updateDaoProfileItem (organization: OrganizationDetails) {
    await charmClient.profile.updateProfileItem({
      profileItems: [{
        id: organization.organizationId,
        isHidden: !organization.isHidden,
        type: 'dao',
        metadata: null
      }]
    });
    mutate((aggregateData) => {
      return aggregateData ? {
        ...aggregateData,
        organizations: aggregateData.organizations.map(dao => {
          if (dao.organizationId === organization.organizationId) {
            return {
              ...dao,
              isHidden: !organization.isHidden
            };
          }
          return dao;
        })
      } : undefined;
    }, {
      revalidate: false
    });
  }

  const totalHiddenItems = hiddenCollectives.length + hiddenDaos.length;

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <AggregatedData user={user} />
      {data && visibleDaos.length !== 0 ? (
        <>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
            <Typography
              sx={{
                typography: {
                  sm: 'h1',
                  xs: 'h2'
                }
              }}
            >Organizations
            </Typography>
            <Chip label={visibleDaos.length} />
          </Stack>
          <Stack gap={2}>
            {visibleDaos.map(organization => (
              <Box
                key={organization.organizationId}
              >
                <DeepDaoOrganizationRow
                  onClick={() => {
                    updateDaoProfileItem(organization);
                  }}
                  visible={true}
                  showVisibilityIcon={!isPublic}
                  organization={organization}
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
            <Typography
              sx={{
                typography: {
                  sm: 'h1',
                  xs: 'h2'
                }
              }}
            >NFTs & POAPs
            </Typography>
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
            >Hidden items
            </Typography>
            <Chip label={hiddenCollectives.length + hiddenDaos.length} />
          </Stack>
          <Stack gap={2} my={1}>
            {hiddenDaos.map(organization => (
              <Box
                key={organization.organizationId}
              >
                <DeepDaoOrganizationRow
                  onClick={() => {
                    updateDaoProfileItem(organization);
                  }}
                  visible={false}
                  showVisibilityIcon={!isPublic}
                  organization={organization}
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
