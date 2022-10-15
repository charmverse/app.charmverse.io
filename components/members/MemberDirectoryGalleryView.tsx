import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Card, Chip, Grid, Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

function MemberDirectoryGalleryCard ({
  member
}: {
  member: Member;
}) {
  const { properties = [] } = useMemberProperties();
  const timezoneProperty = properties.find(property => property.type === 'timezone');
  return (
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
        <Link href={`/u/${member.path}`}>
          <Typography gutterBottom variant='h6' mb={0} component='div'>
            {member.username}
          </Typography>
        </Link>
        {member.profile?.social && <SocialIcons gap={1} social={member.profile.social as Social} />}
        <Stack gap={0.5}>
          <Typography fontWeight='bold' variant='subtitle2'>Roles</Typography>
          <Stack gap={1} flexDirection='row'>
            {member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
          </Stack>
        </Stack>
        <Stack>
          <Typography fontWeight='bold' variant='subtitle2'>About Me</Typography>
          <Typography variant='body2'>{member.profile?.description}</Typography>
        </Stack>
        <Stack flexDirection='row' gap={1}>
          <AccessTimeIcon fontSize='small' />
          <Typography variant='body2'>{member.properties.find(property => property.memberPropertyId === timezoneProperty?.id)?.value ?? 'N/A'}</Typography>
        </Stack>
        {properties.map(property => {
          const memberPropertyValue = member.properties.find(memberProperty => memberProperty.memberPropertyId === property.id);
          switch (property.type) {
            case 'text':
            case 'phone':
            case 'url':
            case 'number': {
              return (
                <Stack>
                  <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                  <Typography variant='body2'>{memberPropertyValue ?? 'N/A'}</Typography>
                </Stack>
              );
            }
            case 'multiselect': {
              const values = memberPropertyValue?.value as string[];
              return (
                <Stack gap={0.5}>
                  <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                  <Stack gap={1} flexDirection='row'>
                    {values.length !== 0 ? values.map(propertyValue => <Chip label={propertyValue} key={propertyValue} size='small' variant='outlined' />) : 'N?A'}
                  </Stack>
                </Stack>
              );
            }
            case 'select': {
              return (
                <Stack gap={0.5}>
                  <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                  {memberPropertyValue?.value ? (
                    <Stack gap={1} flexDirection='row'>
                      <Chip label={memberPropertyValue?.value} key={memberPropertyValue?.value?.toString() ?? ''} size='small' variant='outlined' />
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
  );
}

export function MemberDirectoryGalleryView () {
  const { members } = useMembers();

  return (
    <Grid container>
      {members.map(member => (
        <Grid xs={3} key={member.id}>
          <MemberDirectoryGalleryCard member={member} />
        </Grid>
      ))}
    </Grid>
  );
}
