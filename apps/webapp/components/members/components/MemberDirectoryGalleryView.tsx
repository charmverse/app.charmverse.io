import type { MemberProperty, MemberPropertyType } from '@charmverse/core/prisma';
import EditIcon from '@mui/icons-material/Edit';
import { styled, Box, Card, Chip, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { FarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import type { Member, Social } from '@packages/lib/members/interfaces';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import type { MouseEvent } from 'react';

import Avatar from 'components/common/Avatar';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { SocialIcons } from 'components/members/components/SocialIcons';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useUser } from 'hooks/useUser';

import { MemberPropertyTextMultiline } from './MemberPropertyTextMultiline';
import { TimezoneDisplay } from './TimezoneDisplay';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })};

  height: 100%;
  display: flex;
  &:hover {
    opacity: 0.8;
  }
  position: relative;
  cursor: pointer;
`;

function MemberDirectoryGalleryCard({
  member,
  propertiesRecord,
  visibleProperties
}: {
  visibleProperties: MemberProperty[];
  propertiesRecord: Record<MemberPropertyType, MemberProperty>;
  member: Member;
}) {
  const { formatDate } = useDateFormatter();
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser();
  const { openEditProfile } = useMemberProfileDialog();
  const isDiscordHidden = !propertiesRecord.discord?.enabledViews.includes('gallery');
  const isTwitterHidden = !propertiesRecord.twitter?.enabledViews.includes('gallery');
  const isLinkedInHidden = !propertiesRecord.linked_in?.enabledViews.includes('gallery');
  const isGithubHidden = !propertiesRecord.github?.enabledViews.includes('gallery');
  const isGoogleHidden = !propertiesRecord.google?.enabledViews.includes('gallery');
  const isTelegramHidden = !propertiesRecord.telegram?.enabledViews.includes('gallery');
  const googleProperty = member.properties.find((mp) => mp.memberPropertyId === propertiesRecord.google?.id);
  const telegramProperty = member.properties.find((mp) => mp.memberPropertyId === propertiesRecord.telegram?.id);

  const { showUserProfile } = useMemberProfileDialog();

  const isUserCard = user?.id === member.id && currentSpace;

  function openUserCard(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    showUserProfile(member.id);
  }

  function onClickEdit(e: MouseEvent<HTMLElement>) {
    e.stopPropagation();
    openEditProfile();
  }

  const social = (member.profile?.social as Social) ?? {};

  const content = (
    <Card sx={{ width: '100%' }}>
      {isUserCard && (
        <Tooltip title='Edit my member profile'>
          <IconButton size='small' className='icons' onClick={onClickEdit}>
            <EditIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      )}
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
        <Typography gutterBottom variant='h6' mb={0} component='div' noWrap>
          {member.username}
        </Typography>
        <SocialIcons
          gap={1}
          social={{
            ...social,
            telegramUsername: (telegramProperty?.value as string) ?? '',
            googleName: (googleProperty?.value as string) ?? ''
          }}
          showLinkedIn={!isLinkedInHidden}
          showGithub={!isGithubHidden}
          showDiscord={!isDiscordHidden}
          showTwitter={!isTwitterHidden}
          showGoogle={!isGoogleHidden}
          showTelegram={!isTelegramHidden}
        />
        {visibleProperties.map((property) => {
          const memberProperty = member.properties.find((mp) => mp.memberPropertyId === property.id);
          switch (property.type) {
            case 'bio': {
              return (
                member.profile?.description && (
                  <Stack key={property.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>
                      Bio
                    </Typography>
                    <Typography
                      sx={{
                        wordBreak: 'break-word'
                      }}
                      variant='body2'
                    >
                      {member.profile?.description}
                    </Typography>
                  </Stack>
                )
              );
            }

            case 'join_date': {
              return (
                <Stack key={property.id}>
                  <Typography fontWeight='bold' variant='subtitle2'>
                    {property.name}
                  </Typography>
                  <Typography variant='body2'>{formatDate(member.joinDate)}</Typography>
                </Stack>
              );
            }
            case 'role': {
              return (
                <Stack gap={0.5} key={property.id}>
                  <Typography fontWeight='bold' variant='subtitle2'>
                    Role
                  </Typography>
                  <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                    {member.roles.map((role) => (
                      <Chip label={role.name} key={role.id} size='small' variant='outlined' />
                    ))}
                  </Stack>
                </Stack>
              );
            }
            case 'timezone': {
              return (
                member.profile?.timezone && (
                  <Stack flexDirection='row' gap={1} key={property.id}>
                    <TimezoneDisplay showTimezone timezone={member.profile.timezone} />
                  </Stack>
                )
              );
            }
            case 'farcaster': {
              return (
                member.farcasterUser && (
                  <Stack key={property.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>
                      Farcaster
                    </Typography>
                    <Typography variant='body2'>{member.farcasterUser.username}</Typography>
                  </Stack>
                )
              );
            }
            case 'text_multiline': {
              return (
                memberProperty?.value && (
                  <MemberPropertyTextMultiline
                    key={property.id}
                    label={property.name}
                    value={memberProperty.value as string}
                  />
                )
              );
            }
            case 'text':
            case 'phone':
            case 'email':
            case 'url':
            case 'number': {
              return (
                memberProperty?.value && (
                  <Stack
                    key={property.id}
                    sx={{
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography
                      data-test={`member-property-name-${memberProperty.memberPropertyId}`}
                      fontWeight='bold'
                      variant='subtitle2'
                    >
                      {property.name}
                    </Typography>
                    <Typography data-test={`member-property-value-${memberProperty.memberPropertyId}`} variant='body2'>
                      {memberProperty.value as string}
                    </Typography>
                  </Stack>
                )
              );
            }
            case 'select':
            case 'multiselect': {
              const hasValue =
                (!!memberProperty?.value && typeof memberProperty.value === 'string') ||
                (Array.isArray(memberProperty?.value) && memberProperty!.value.length > 0);

              return hasValue ? (
                <SelectPreview
                  data-test={`member-property-name-${memberProperty?.memberPropertyId}`}
                  size='small'
                  wrapColumn
                  options={property.options as SelectOptionType[]}
                  value={memberProperty?.value as string | string[]}
                  name={property.name}
                  key={property.id}
                />
              ) : null;
            }

            default: {
              return null;
            }
          }
        })}
      </Stack>
    </Card>
  );

  return (
    <StyledBox onClick={openUserCard} color='primary'>
      {content}
    </StyledBox>
  );
}

export function MemberDirectoryGalleryView({ members }: { members: Member[] }) {
  const { getDisplayProperties } = useMemberProperties();
  const visibleProperties = getDisplayProperties('gallery');
  const propertiesRecord = visibleProperties.reduce<Record<MemberPropertyType, MemberProperty>>((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as any);

  return (
    <Grid container gap={2.5}>
      {members.map((member) => (
        <Grid size={{ xs: 12, sm: 5, md: 3.75 }} key={member.id}>
          <MemberDirectoryGalleryCard
            member={member}
            visibleProperties={visibleProperties}
            propertiesRecord={propertiesRecord}
          />
        </Grid>
      ))}
    </Grid>
  );
}
