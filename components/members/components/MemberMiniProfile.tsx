import { Dialog, DialogContent, Typography, useMediaQuery } from '@mui/material';
import { Stack, useTheme } from '@mui/system';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { UserDetails } from 'components/profile/components';
import { useMemberProperties } from 'hooks/useMemberProperties';
import type { Member } from 'lib/members/interfaces';

import { SpacesMemberDetails } from '../../profile/components/SpacesMemberDetails/SpacesMemberDetails';

export function MemberMiniProfile({ member, onClose }: { member: Member; onClose: VoidFunction }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { properties = [] } = useMemberProperties();
  const propertiesRecord = properties.reduce((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as Record<MemberPropertyType, MemberProperty>);

  const username =
    (member.properties.find((memberProperty) => memberProperty.memberPropertyId === propertiesRecord.name?.id)
      ?.value as string) ?? member.username;

  const { data: user, isLoading } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path as string)
  );

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
              <Typography>{username} public profile</Typography>
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
            <SpacesMemberDetails memberId={user.id} />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
