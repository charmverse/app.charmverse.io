import type { MemberProperty } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import type { SelectOptionType } from '@root/lib/forms/interfaces';

import Avatar from 'components/common/Avatar';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useUser } from 'hooks/useUser';
import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import type { Member, Social } from 'lib/members/interfaces';

import { useMemberProfileDialog } from '../hooks/useMemberProfileDialog';

import { MemberPropertyTextMultiline } from './MemberPropertyTextMultiline';
import { TimezoneDisplay } from './TimezoneDisplay';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
`;

const StyledTableRow = styled(TableRow)`
  ${hoverIconsStyle()}
`;

function MemberDirectoryTableRow({
  member,
  visibleProperties
}: {
  visibleProperties: MemberProperty[];

  member: Member;
}) {
  const twitterUrl = (member.profile?.social as Social)?.twitterURL ?? '';
  const twitterHandle = twitterUrl.split('/').at(-1);
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser();
  const { openEditProfile } = useMemberProfileDialog();
  const { formatDate } = useDateFormatter();

  if (visibleProperties.length === 0) {
    return null;
  }

  return (
    <StyledTableRow>
      <TableCell
        sx={{
          p: 1
        }}
      >
        {user?.id === member.id && currentSpace && (
          <IconButton
            size='small'
            className='icons'
            onClick={(e) => {
              e.stopPropagation();
              openEditProfile();
            }}
            style={{
              opacity: 1
            }}
          >
            <EditIcon fontSize='small' />
          </IconButton>
        )}
      </TableCell>
      {visibleProperties.map((property) => {
        const memberProperty = member.properties.find((_property) => _property.memberPropertyId === property.id);
        if (memberProperty) {
          switch (property.type) {
            case 'profile_pic': {
              return (
                <TableCell
                  key={property.id}
                  sx={{
                    p: 1
                  }}
                >
                  <Avatar avatar={member.avatar} name={member.username} variant='circular' size='large' />
                </TableCell>
              );
            }
            case 'role': {
              return (
                <TableCell key={property.id}>
                  <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                    {member.roles.map((role) => (
                      <Chip label={role.name} key={role.id} size='small' variant='outlined' />
                    ))}
                  </Stack>
                </TableCell>
              );
            }
            case 'join_date': {
              return (
                <TableCell>
                  <Typography variant='body2'>{formatDate(member.joinDate)}</Typography>
                </TableCell>
              );
            }
            case 'twitter': {
              return (
                <TableCell key={property.id}>
                  {twitterHandle ? (
                    <Link target='_blank' href={`https://x.com/${twitterHandle}`}>
                      @{twitterHandle}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
              );
            }
            case 'timezone': {
              return (
                <TableCell key={property.id}>
                  <Box
                    sx={{
                      gap: 1,
                      display: 'flex',
                      flexDirection: 'row'
                    }}
                  >
                    {member.profile?.timezone ? (
                      <TimezoneDisplay showTimezone timezone={member.profile.timezone} />
                    ) : (
                      '-'
                    )}
                  </Box>
                </TableCell>
              );
            }
            case 'bio': {
              return (
                <TableCell key={property.id}>
                  <Typography>{member.profile?.description ?? '-'}</Typography>
                </TableCell>
              );
            }
            case 'text_multiline': {
              return (
                <TableCell key={property.id}>
                  {memberProperty?.value ? <MemberPropertyTextMultiline value={memberProperty.value as string} /> : '-'}
                </TableCell>
              );
            }
            case 'text':
            case 'phone':
            case 'email':
            case 'google':
            case 'telegram':
            case 'discord':
            case 'number': {
              return (
                <TableCell key={property.id}>
                  <Typography variant='body2'>{(memberProperty.value as string) ?? '-'}</Typography>
                </TableCell>
              );
            }
            case 'farcaster': {
              return (
                <TableCell key={property.id}>
                  <Typography variant='body2'>{member.farcasterUser ? member.farcasterUser.username : '-'}</Typography>
                </TableCell>
              );
            }
            case 'url': {
              return (
                <TableCell key={property.id}>
                  {memberProperty.value ? (
                    <Link external target='_blank' color='inherit' href={memberProperty.value as string}>
                      {memberProperty.value as string}
                    </Link>
                  ) : (
                    <Typography variant='body2'>-</Typography>
                  )}
                </TableCell>
              );
            }

            case 'select':
            case 'multiselect': {
              return (
                <TableCell
                  key={property.id}
                  sx={{
                    minWidth: 250
                  }}
                >
                  {memberProperty.value ? (
                    <SelectPreview
                      wrapColumn
                      size='small'
                      options={property.options as SelectOptionType[]}
                      value={memberProperty.value as string | string[]}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
              );
            }
            default: {
              return (
                <TableCell key={property.id}>
                  <Typography variant='body2'>{(memberProperty.value as string) ?? '-'}</Typography>
                </TableCell>
              );
            }
          }
        }
        return null;
      })}
    </StyledTableRow>
  );
}

export function MemberDirectoryTableView({ members }: { members: Member[] }) {
  const { getDisplayProperties } = useMemberProperties();

  const visibleProperties = getDisplayProperties('table');
  return (
    <Table
      size='small'
      sx={{
        my: 2,
        '& .MuiTableCell-root': {
          whiteSpace: 'nowrap',
          maxWidth: 250,
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }
      }}
    >
      <TableHead>
        <TableRow>
          <StyledTableCell></StyledTableCell>
          {visibleProperties.map((property) => (
            <StyledTableCell key={property.id}>{property.name}</StyledTableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map((member) => (
          <MemberDirectoryTableRow visibleProperties={visibleProperties} member={member} key={member.id} />
        ))}
      </TableBody>
    </Table>
  );
}
