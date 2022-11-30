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
import { useState } from 'react';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { MemberPropertiesPopup } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import { DiscordSocialIcon } from 'components/profile/components/UserDetails/DiscordSocialIcon';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';

import { MemberPropertyTextMultiline } from './MemberDirectoryProperties/MemberPropertyTextMultiline';
import { TimezoneDisplay } from './TimezoneDisplay';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
`;

const StyledTableRow = styled(TableRow)`
  ${hoverIconsStyle()}
`;

function MemberDirectoryTableRow({ member }: { member: Member }) {
  const twitterUrl = (member.profile?.social as Social)?.twitterURL ?? '';
  const twitterHandle = twitterUrl.split('/').at(-1);
  const discordUsername = (member.profile?.social as Social)?.discordUsername;
  const currentSpace = useCurrentSpace();
  const { user } = useUser();
  const admin = isAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { properties = [] } = useMemberProperties();
  const { mutateMembers } = useMembers();
  const visibleProperties = properties.filter((property) => property.enabledViews.includes('table'));

  if (visibleProperties.length === 0) {
    return null;
  }

  const updateMemberPropertyValues = async (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => {
    await charmClient.members.updateSpacePropertyValues(member.id, spaceId, values);
    mutateMembers();
  };

  return (
    <StyledTableRow>
      <TableCell
        sx={{
          p: 1
        }}
      >
        {((user?.id === member.id && currentSpace) || admin) && (
          <IconButton
            size='small'
            className='icons'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            style={
              !admin
                ? {
                    opacity: 1
                  }
                : {}
            }
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
                    {member.roles.length === 0
                      ? '-'
                      : member.roles.map((role) => (
                          <Chip label={role.name} key={role.id} size='small' variant='outlined' />
                        ))}
                  </Stack>
                </TableCell>
              );
            }
            case 'discord': {
              return (
                <TableCell key={property.id}>
                  {discordUsername ? (
                    <DiscordSocialIcon showLogo={false} showUsername username={discordUsername} />
                  ) : (
                    '-'
                  )}
                </TableCell>
              );
            }
            case 'join_date': {
              return (
                <TableCell>
                  <Typography variant='body2'>
                    {humanFriendlyDate(member.joinDate, {
                      withYear: true
                    })}
                  </Typography>
                </TableCell>
              );
            }
            case 'twitter': {
              return (
                <TableCell key={property.id}>
                  {twitterHandle ? (
                    <Link target='_blank' href={`https://twitter.com/${twitterHandle}`}>
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
            case 'name': {
              return (
                <TableCell key={property.id}>
                  <Link
                    color='inherit'
                    href={`/u/${member.path || member.id}${currentSpace ? `?workspace=${currentSpace.id}` : ''}`}
                  >
                    <Typography fontWeight='bold'>{memberProperty.value ?? member.username}</Typography>
                  </Link>
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
            case 'url':
            case 'number': {
              return (
                <TableCell key={property.id}>
                  <Typography variant='body2'>{memberProperty.value ?? '-'}</Typography>
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
                  <Typography variant='body2'>{memberProperty.value ?? '-'}</Typography>
                </TableCell>
              );
            }
          }
        }
        return null;
      })}
      {isModalOpen && user && currentSpace && (
        <MemberPropertiesPopup
          onClose={() => {
            setIsModalOpen(false);
          }}
          memberId={member.id}
          spaceId={currentSpace.id}
          updateMemberPropertyValues={updateMemberPropertyValues}
        />
      )}
    </StyledTableRow>
  );
}

export function MemberDirectoryTableView({ members }: { members: Member[] }) {
  const { properties = [] } = useMemberProperties();

  const visibleProperties = properties.filter((property) => property.enabledViews.includes('table'));
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
          <MemberDirectoryTableRow member={member} key={member.id} />
        ))}
      </TableBody>
    </Table>
  );
}
