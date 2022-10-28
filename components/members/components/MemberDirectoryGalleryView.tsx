import { Card, Chip, Grid, Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useMemberProperties } from 'hooks/useMemberProperties';
import type { Member } from 'lib/members/interfaces';

import type { PropertyOption } from './MemberDirectoryProperties/MemberPropertySelectInput';
import { TimezoneDisplay } from './TimezoneDisplay';

function MemberDirectoryGalleryCard ({
  member
}: {
  member: Member;
}) {
  const { properties = [] } = useMemberProperties();
  const nameProperty = properties.find(property => property.type === 'name');

  return (
    <Link
      href={`/u/${member.path || member.id}`}
      color='primary'
      sx={{
        '&:hover': {
          opacity: 0.8
        }
      }}
    >
      <Card sx={{ width: '100%' }}>
        <Avatar
          sx={{
            width: '100%'
          }}
          avatar={member.avatar}
          name={member.username}
          size='2xLarge'
          variant='square'
        />
        <Stack p={2} gap={1}>
          <Typography gutterBottom variant='h6' mb={0} component='div'>
            {member.properties.find(memberProperty => memberProperty.memberPropertyId === nameProperty?.id)?.value ?? member.username}
          </Typography>
          {member.profile?.social && <SocialIcons gap={1} social={member.profile.social as Social} />}
          <Stack gap={0.5}>
            <Typography fontWeight='bold' variant='subtitle2'>Roles</Typography>
            <Stack gap={1} flexDirection='row' flexWrap='wrap'>
              {member.roles.length === 0 ? 'N/A' : member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
            </Stack>
          </Stack>
          <Stack flexDirection='row' gap={1}>
            <TimezoneDisplay
              showTimezone
              timezone={member.profile?.timezone}
            />
          </Stack>
          {properties.map(property => {
            const memberPropertyValue = member.properties.find(memberProperty => memberProperty.memberPropertyId === property.id);
            switch (property.type) {
              case 'text':
              case 'text_multiline':
              case 'phone':
              case 'email':
              case 'url':
              case 'number': {
                return (
                  <Stack key={property.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                    <Typography variant='body2'>{memberPropertyValue?.value ?? 'N/A'}</Typography>
                  </Stack>
                );
              }
              case 'multiselect': {
                const values = (memberPropertyValue?.value ?? []) as PropertyOption[];
                return (
                  <Stack gap={0.5} key={property.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                    <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                      {values.length !== 0 ? values.map(propertyValue => <Chip label={propertyValue.name} color={propertyValue.color} key={propertyValue.name} size='small' variant='outlined' />) : 'N/A'}
                    </Stack>
                  </Stack>
                );
              }
              case 'select': {
                const propertyValue = memberPropertyValue?.value as PropertyOption;
                return (
                  <Stack gap={0.5} key={property.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                    {propertyValue ? (
                      <Stack gap={1} flexDirection='row'>
                        <Chip label={propertyValue.name} key={propertyValue.name?.toString() ?? ''} color={propertyValue.color} size='small' variant='outlined' />
                      </Stack>
                    ) : <Typography variant='body2'>N/A</Typography>}
                  </Stack>
                );
              }
              default: {
                return null;
              }
            }
          })}
        </Stack>
      </Card>
    </Link>
  );
}

export function MemberDirectoryGalleryView ({
  members
}: {
  members: Member[];
}) {
  return (
    <Grid container gap={2.5}>
      {members.map(member => (
        <Grid item xs={12} sm={5} md={3.75} key={member.id}>
          <MemberDirectoryGalleryCard member={member} />
        </Grid>
      ))}
    </Grid>
  );
}
