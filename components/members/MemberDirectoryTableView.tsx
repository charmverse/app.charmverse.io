import styled from '@emotion/styled';
import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import { DiscordSocialIcon } from 'components/profile/components/UserDetails/DiscordSocialIcon';
import type { Social } from 'components/profile/interfaces';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
`;

export function MemberDirectoryTableView () {
  const { properties = [] } = useMemberProperties();
  const { members } = useMembers();
  const timezoneProperty = properties.find(property => property.type === 'timezone');

  return (
    <Table
      size='small'
      sx={{
        my: 2
      }}
    >
      <TableHead>
        <TableRow>
          <StyledTableCell />
          {['Name', 'Role', 'Discord', 'Twitter', 'Timezone', ...properties.map(property => property.name)].map(property => <StyledTableCell key={property}>{property}</StyledTableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map(member => {
          const twitterUrl = (member.profile?.social as Social)?.twitterURL ?? '';
          const twitterHandle = twitterUrl.split('/').at(-1);
          const discordUsername = (member.profile?.social as Social)?.discordUsername;
          return (
            <TableRow
              key={member.id}
            >
              <TableCell sx={{
                p: 1
              }}
              >
                <Avatar avatar={member.avatar} name={member.username} variant='circular' size='large' />
              </TableCell>
              <TableCell>
                <Typography fontWeight='bold'>
                  {member.username}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack gap={1} flexDirection='row'>
                  {member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
                </Stack>
              </TableCell>
              <TableCell>
                {discordUsername ? <DiscordSocialIcon showLogo={false} showUsername username={discordUsername} /> : 'N/A'}
              </TableCell>
              <TableCell>
                {twitterHandle ? <Link target='_blank' href={`https://twitter.com/${twitterHandle}`}>@{twitterHandle}</Link> : 'N/A'}
              </TableCell>
              <TableCell>
                <Typography variant='body2'>{member.properties.find(property => property.memberPropertyId === timezoneProperty?.id)?.value ?? 'N/A'}</Typography>
              </TableCell>
              {properties.map(property => {
                const memberProperty = member.properties.find(_property => _property.memberPropertyId === property.id);
                if (memberProperty) {
                  switch (property.type) {
                    case 'text':
                    case 'phone':
                    case 'url':
                    case 'number': {
                      return (
                        <TableCell key={property.id}>
                          <Typography variant='body2'>{memberProperty.value ?? 'N/A'}</Typography>
                        </TableCell>
                      );
                    }
                    case 'multiselect': {
                      return (
                        <TableCell>
                          <Stack gap={1} flexDirection='row'>
                            {(memberProperty?.value as string[]).map(propertyValue => <Chip label={propertyValue} key={propertyValue} size='small' variant='outlined' />)}
                          </Stack>
                        </TableCell>
                      );
                    }
                    case 'select': {
                      return (
                        <TableCell>
                          {memberProperty?.value ? (
                            <Stack gap={1} flexDirection='row'>
                              <Chip label={memberProperty?.value} key={memberProperty?.value?.toString() ?? ''} size='small' variant='outlined' />
                            </Stack>
                          ) : 'N/A'}
                        </TableCell>
                      );
                    }
                    default: {
                      return (
                        <TableCell key={property.id}>
                          <Typography variant='body2'>{memberProperty.value ?? 'N/A'}</Typography>
                        </TableCell>
                      );
                    }
                  }
                }
                return null;
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
