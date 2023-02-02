import { Dialog, DialogContent, Divider, Typography, useMediaQuery } from '@mui/material';
import { Box, Stack, useTheme } from '@mui/system';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { UserDetails } from 'components/profile/components';
import { MemberPropertiesRenderer } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesRenderer';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';

import { MemberPropertiesPopup } from '../SpacesMemberDetails/components/MemberPropertiesPopup';

import { NftsList } from './NftsList';
import { OrgsList } from './OrgsList';
import { PoapsList } from './PoapsList';

export function MemberMiniProfile({ member, onClose }: { member: Member; onClose: VoidFunction }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser, setUser } = useUser();
  const currentSpace = useCurrentSpace();
  const { properties = [] } = useMemberProperties();
  const propertiesRecord = properties.reduce((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as Record<MemberPropertyType, MemberProperty>);
  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );
  const { mutateMembers } = useMembers();
  const { updateSpaceValues } = useMemberPropertyValues(member.id);

  const { data: poaps = [], isLoading: isFetchingPoaps } = useSWRImmutable(`/poaps/${member.id}`, () => {
    return charmClient.getUserPoaps(member.id);
  });

  const {
    data: orgs = [],
    mutate: mutateOrgs,
    isLoading: isFetchingOrgs
  } = useSWRImmutable(`/orgs/${member.id}`, () => {
    return charmClient.profile.getOrgs(member.id);
  });

  const {
    data: nfts = [],
    mutate: mutateNfts,
    isLoading: isFetchingNfts
  } = useSWRImmutable(`/nfts/${member.id}`, () => {
    return charmClient.blockchain.listNFTs(member.id);
  });

  const username =
    (member.properties.find((memberProperty) => memberProperty.memberPropertyId === propertiesRecord.name?.id)
      ?.value as string) ?? member.username;

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path as string)
  );

  const isLoading = isFetchingUser || isFetchingPoaps || isFetchingNfts || isFetchingOrgs;

  if (!currentSpace || !currentUser) {
    return null;
  }

  if (member.id === currentUser.id) {
    return (
      <MemberPropertiesPopup
        title='Edit your profile'
        onClose={() => {
          mutateMembers();
          onClose();
        }}
        isLoading={isLoading}
        memberId={currentUser.id}
        spaceId={currentSpace.id}
        updateMemberPropertyValues={updateSpaceValues}
        cancelButtonText='Cancel'
      >
        {user && (
          <>
            <UserDetails
              sx={{
                mt: 0
              }}
              // currentUser doesn't have profile thus is not considered as publicUser inside UserDetails
              // giving the ability to update the profile properties
              user={user.id === currentUser?.id ? currentUser : user}
              updateUser={setUser}
            />
            <Stack gap={3}>
              <NftsList mutateNfts={mutateNfts} nfts={nfts} memberId={user.id} />
              <OrgsList mutateOrgs={mutateOrgs} orgs={orgs} memberId={user.id} />
              <PoapsList poaps={poaps} />
              <Divider
                sx={{
                  mb: 3
                }}
              />
            </Stack>
          </>
        )}
        <Typography fontWeight={600}>Member details</Typography>
      </MemberPropertiesPopup>
    );
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth>
      {isLoading || !user ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle
            sx={{ '&&': { px: 2, py: 2 }, display: 'flex', justifyContent: 'space-between' }}
            onClose={onClose}
          >
            <Stack display='flex' flexDirection='row' width='100%' alignItems='center' justifyContent='space-between'>
              <Typography variant='h6'>{username}'s profile</Typography>
              <Button
                href={`/u/${user.path}`}
                color='secondary'
                variant='outlined'
                sx={{
                  mx: 1
                }}
              >
                View full profile
              </Button>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <UserDetails user={user} readOnly />
            {currentSpacePropertyValues && (
              <Box my={3}>
                <MemberPropertiesRenderer properties={currentSpacePropertyValues.properties} />
              </Box>
            )}

            <Stack gap={3}>
              <NftsList nfts={nfts} memberId={user.id} />
              <OrgsList orgs={orgs} memberId={user.id} />
              <PoapsList poaps={poaps} />
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
