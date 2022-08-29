import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import { sortDeepdaoOrgs } from 'lib/deepdao/sortDeepdaoOrgs';
import AggregatedData from './components/AggregatedData';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import ProfileItems from './components/ProfileItems';
import DeepDaoOrganizationRow, { OrganizationDetails } from './components/DeepDaoOrganizationRow';

export default function PublicProfile (props: UserDetailsProps) {
  const { data, mutate } = useSWRImmutable(props.user ? `userAggregatedData/${props.user.id}` : null, () => {
    return charmClient.getAggregatedData(props.user.id);
  });
  const isPublic = isPublicUser(props.user);

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

  async function updateDaoProfileItem (organization: OrganizationDetails) {
    if (data) {
      await charmClient.profile.updateProfileItem({
        profileItems: [{
          id: organization.organizationId,
          isHidden: !organization.isHidden,
          type: 'dao',
          metadata: null
        }]
      });
      mutate(() => {
        return {
          ...data,
          organizations: data.organizations.map(dao => {
            if (dao.organizationId === organization.organizationId) {
              return {
                ...dao,
                isHidden: !organization.isHidden
              };
            }
            return dao;
          })
        };
      }, {
        revalidate: false
      });
    }
  }

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <AggregatedData user={props.user} />
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
      <ProfileItems user={props.user} />
      {!isPublic && data && hiddenDaos.length !== 0 ? (
        <Stack gap={2}>
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
      ) : null}
    </Stack>
  );
}
