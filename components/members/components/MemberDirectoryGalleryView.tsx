import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import { Card, Chip, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import { isTouchScreen } from 'lib/utilities/browser';

import { TimezoneDisplay } from './TimezoneDisplay';

const StyledLink = styled(Link)`
  ${({ theme }) => hoverIconsStyle({ theme, isTouchScreen: isTouchScreen() })}
`;

function MemberDirectoryGalleryCard ({
  member
}: {
  member: Member;
}) {
  const { properties = [] } = useMemberProperties();
  const nameProperty = properties.find(property => property.type === 'name');
  const timezoneProperty = properties.find(property => property.type === 'timezone');
  const rolesProperty = properties.find(property => property.type === 'role');
  const discordProperty = properties.find(property => property.type === 'discord');
  const twitterProperty = properties.find(property => property.type === 'twitter');
  const [currentSpace] = useCurrentSpace();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { updateSpaceValues } = useMemberPropertyValues(member.id);
  const { mutateMembers } = useMembers();

  const isNameHidden = !nameProperty?.enabledViews.includes('gallery');
  const isTimezoneHidden = !timezoneProperty?.enabledViews.includes('gallery');
  const isRolesHidden = !rolesProperty?.enabledViews.includes('gallery');
  const isDiscordHidden = !discordProperty?.enabledViews.includes('gallery');
  const isTwitterHidden = !twitterProperty?.enabledViews.includes('gallery');
  const admin = isAdmin();

  const social = member.profile?.social as Social ?? {};
  return (
    <>
      <StyledLink
        href={`/u/${member.path || member.id}`}
        color='primary'
        sx={{
          '&:hover': {
            opacity: 0.8
          },
          position: 'relative'
        }}
      >
        <Card sx={{ width: '100%' }}>
          {((user?.id === member.id && currentSpace) || admin) && (
            <IconButton
              size='small'
              className={!admin ? '' : 'icons'}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              <EditIcon fontSize='small' />
            </IconButton>
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
            {!isNameHidden && (
              <Typography gutterBottom variant='h6' mb={0} component='div'>
                {member.properties.find(memberProperty => memberProperty.memberPropertyId === nameProperty?.id)?.value ?? member.username}
              </Typography>
            )}
            <SocialIcons
              gap={1}
              social={social}
              showDiscord={!isDiscordHidden}
              showTwitter={!isTwitterHidden}
            />
            {properties.map(property => {
              const memberPropertyValue = member.properties.find(memberProperty => memberProperty.memberPropertyId === property.id);
              const hiddenInGallery = !property.enabledViews.includes('gallery');
              if (hiddenInGallery) {
                return null;
              }
              switch (property.type) {
                case 'role': {
                  return !isRolesHidden && (
                    <Stack gap={0.5}>
                      <Typography fontWeight='bold' variant='subtitle2'>Roles</Typography>
                      <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                        {member.roles.length === 0 ? 'N/A' : member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
                      </Stack>
                    </Stack>
                  );
                }
                case 'timezone': {
                  return !isTimezoneHidden && (
                    <Stack flexDirection='row' gap={1}>
                      <TimezoneDisplay
                        showTimezone
                        timezone={member.profile?.timezone}
                      />
                    </Stack>
                  );
                }
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
                case 'select':
                case 'multiselect': {
                  return memberPropertyValue
                    ? (
                      <SelectPreview
                        size='small'
                        options={property.options as SelectOptionType[]}
                        value={memberPropertyValue.value as (string | string[])}
                        name={property.name}
                      />
                    )
                    : null;
                }

                default: {
                  return null;
                }
              }
            })}
          </Stack>
        </Card>
      </StyledLink>
      {isModalOpen && user && currentSpace && (
        <MemberPropertiesPopupForm
          onClose={() => {
            setIsModalOpen(false);
            mutateMembers();
          }}
          memberId={member.id}
          spaceId={currentSpace.id}
          updateMemberPropertyValues={updateSpaceValues}
        />
      )}
    </>
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
