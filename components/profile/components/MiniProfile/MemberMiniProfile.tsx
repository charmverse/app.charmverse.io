import { Dialog, DialogContent, Typography, useMediaQuery } from '@mui/material';
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
import type { Member } from 'lib/members/interfaces';

import { PoapsList } from './PoapsList';

export function MemberMiniProfile({ member, onClose }: { member: Member; onClose: VoidFunction }) {
  const theme = useTheme();
  const currentSpace = useCurrentSpace();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { properties = [] } = useMemberProperties();
  const propertiesRecord = properties.reduce((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as Record<MemberPropertyType, MemberProperty>);
  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );

  const { data: poaps = [], isLoading: isFetchingPoaps } = useSWRImmutable(`/poaps/${member.id}`, () => {
    return charmClient.getUserPoaps();
  });

  const username =
    (member.properties.find((memberProperty) => memberProperty.memberPropertyId === propertiesRecord.name?.id)
      ?.value as string) ?? member.username;

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path as string)
  );

  const isLoading = isFetchingUser || isFetchingPoaps;

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

            <PoapsList poaps={poaps} />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
